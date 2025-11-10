package kr.tx24.fc.service;

import com.google.common.net.HttpHeaders;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import kr.tx24.fc.bean.TxResponse;
import kr.tx24.fc.enums.MockNames;
import kr.tx24.fc.enums.TxResultCode;
import kr.tx24.fc.exception.TxException;
import kr.tx24.fc.repository.DummyRepository;
import kr.tx24.lib.crypt.Argon2;
import kr.tx24.lib.lang.CommonUtils;
import kr.tx24.lib.lang.MsgUtils;
import kr.tx24.lib.map.SharedMap;
import kr.tx24.lib.map.TypeRegistry;
import kr.tx24.lib.redis.RedisUtils;
import kr.tx24.was.util.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;

@Service
public class SignService {

    private static final Logger logger = LoggerFactory.getLogger(SignService.class);

    public static final String CSRF_FORMAT = "TX_CSRF_KEY:{}";
    private final NotificationService notificationService;

    public SignService(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    /**
     * 로그인
     */
    public TxResponse<?> in(SharedMap<String, Object> param, TxResponse<?> response) {
		if (CommonUtils.hasEmptyValue(param, List.of("id", "password", "_csrf"))) {
			throw new TxException(TxResultCode.INVALID_REQUEST, "필수 값이 누락되었습니다.");
		}

        String id = param.getString("id");
        String pw = param.getString("password");
        String csrf = param.getString("_csrf");

//         csrf 검증
        if (!RedisUtils.exists(param.getString("_csrf"))) {
            throw new TxException(TxResultCode.SECURITY_VIOLATION);
        }


        SharedMap<String, Object> userData = DummyRepository.of(MockNames.USER);
        if (userData == null) {
            throw new TxException(TxResultCode.NO_CONTENTS, "가입 정보를 찾을 수 없습니다.");
        }

        if (!userData.isEquals("id", id)) {
			throw new TxException(TxResultCode.NO_CONTENTS, "가입 정보를 찾을 수 없습니다.");
		}

        // 상태 확인
        if (!userData.isEquals("status", "active")) {
            logger.info("user : {} | status : {}", id, userData.getString("status"));
            throw new TxException(TxResultCode.NO_CONTENTS, "사용 가능한 계정이 아닙니다.");
        }

        // 패스워드 확인
        if (!Argon2.fastVerify(pw, userData.getString("password"))) {
            throw new TxException(TxResultCode.INVALID_REQUEST, "패스워드가 일치하지 않습니다.");
        }

        // 2차인증 준비
        String csrfRedisKey = MsgUtils.format(CSRF_FORMAT, csrf);
        RedisUtils.set(csrfRedisKey, userData, Duration.ofMinutes(5).getSeconds());


        // 2차 인증 레디스 생성
        return response.link("/sign/two-factor").result(true).msg(param.getString("_csrf"));
    }

    /**
     * 2차 인증 화면 키 검증
     * 유효기간 5분 재 설정
     */
    public void twoFactorAuth(String key) {
        String csrfRedisKey = MsgUtils.format(CSRF_FORMAT, key);

        // 해당 레디스 키 존재하지 않음
        if (!RedisUtils.exists(csrfRedisKey)) {
            throw new TxException(TxResultCode.SECURITY_VIOLATION);
        }

        // 5분 재설정
        RedisUtils.pexpire(csrfRedisKey, Duration.ofMinutes(5).getSeconds() * 1000);
    }

    /**
     * 2차인증 발송
     *
     */
    public void sendTwoFactorAuth(SharedMap<String,Object> param) {
        if (CommonUtils.hasEmptyValue(param, List.of("csrf", "type"))) {
            throw new TxException(TxResultCode.INVALID_REQUEST, "요청 파라미터가 유효하지 않습니다. 관리자에게 문의해주시기 바랍니다.");
        }

        String csrf = param.getString("csrf");
        String type = param.getString("type");
        String csrfRedisKey = MsgUtils.format(CSRF_FORMAT, csrf);

        SharedMap<String,Object> userMap = RedisUtils.get(csrfRedisKey, TypeRegistry.MAP_SHAREDMAP_OBJECT);
        if (CommonUtils.isEmpty(userMap)) {
            logger.info("2차 인증 유효기간 초과");
            throw new TxException(TxResultCode.SECURITY_VIOLATION, "인증 유효시간을 초과했습니다.");
        }

        // 2차인증 노티 전송 OTP 미 전송
        if (!type.equalsIgnoreCase("otp")) {
            notificationService.sendTwoFactorAuth(csrf, type, userMap.getString(type.toLowerCase(), ""));
        }

        // SESSION에 들어갈 userData tll 연장
        RedisUtils.pexpire(csrfRedisKey, Duration.ofMinutes(5).getSeconds() * 1000);
    }

    /**
     * 2차 인증 검증
     */
    public void verifyTwoFactorAuth(HttpServletRequest request, HttpServletResponse response, SharedMap<String, Object> headerMap, SharedMap<String, Object> param) {
        if (CommonUtils.hasEmptyValue(param, List.of("type", "csrf", "code"))) {
            throw new TxException(TxResultCode.INVALID_REQUEST, "요청 파라미터가 유효하지 않습니다. 관리자에게 문의해주시기 바랍니다.");
        }

        String type = param.getString("type").toUpperCase();
        String csrf = param.getString("csrf");
        String code = param.getString("code");
        // 인증 코드 확인
        String twoFactorRedisKey = MsgUtils.format(NotificationService.TWO_FACTOR_FORMAT, type, csrf);
        // 유저 정보 확인
        String userRedisKey = MsgUtils.format(CSRF_FORMAT, csrf);

        // 토큰 만료
        if (!RedisUtils.exists(twoFactorRedisKey) || !RedisUtils.exists(userRedisKey)) {
            throw new TxException(TxResultCode.SECURITY_VIOLATION, "이미 만료된 토큰입니다. 다시 로그인을 시도해주세요.");
        }

        // 인증 코드 확인
        String twoFactorCode = RedisUtils.get(twoFactorRedisKey, TypeRegistry.STRING);
        if (!twoFactorCode.equals(code)) {
            throw new TxException(TxResultCode.SECURITY_VIOLATION, "인증 코드가 일치하지 않습니다.");
        }

        // 임시 세션내 유저 정보 조회
        SharedMap<String, Object> userMap = RedisUtils.get(userRedisKey, TypeRegistry.MAP_SHAREDMAP_OBJECT);
        if (CommonUtils.isEmpty(userMap)) {
            logger.info("인증 코드 일치 | 토큰 만료로인해 유저 정보 조회 실패");
            throw new TxException(TxResultCode.SECURITY_VIOLATION, "이미 만료된 토큰입니다. 다시 로그인을 시도해주세요.");
        }


        // 세션 생성
        // TODO: 로그인 기록, 세션 데이터 생성...

        String sessionId = SessionUtils.create(userMap.getString("id"), userMap);
        userMap.put("sessionId", sessionId);

        // 쿠키에 세션 데이터 저장
        CookieUtils.create(response, request.getHeader("host"), "/", Was.SESSION_ID, sessionId, Was.SESSION_EXPIRE, false, true);

        // SESSION DATABASE 저장
        UserAgent ua = UADetect.set(headerMap.getString(HttpHeaders.USER_AGENT.toLowerCase()));
        // TODO: DB 저장 로직

    }

}
