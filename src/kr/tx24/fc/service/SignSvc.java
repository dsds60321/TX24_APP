package kr.tx24.fc.service;

import com.google.common.net.HttpHeaders;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import kr.tx24.fc.bean.TxResponse;
import kr.tx24.fc.consts.Consts;
import kr.tx24.fc.enums.MockNames;
import kr.tx24.fc.enums.TxResultCode;
import kr.tx24.fc.exception.TxException;
import kr.tx24.fc.repository.DummyRepository;
import kr.tx24.fc.util.OtpUtil;
import kr.tx24.lib.crypt.Argon2;
import kr.tx24.lib.lang.CommonUtils;
import kr.tx24.lib.lang.MsgUtils;
import kr.tx24.lib.map.SharedMap;
import kr.tx24.lib.map.TypeRegistry;
import kr.tx24.lib.redis.Redis;
import kr.tx24.lib.redis.RedisUtils;
import kr.tx24.was.util.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;

import static kr.tx24.fc.consts.Consts.Login.CSRF_FORMAT;

@Service
public class SignSvc {

    private static final Logger logger = LoggerFactory.getLogger(SignSvc.class);

    private final NotificationSvc notificationSvc;

    public SignSvc(NotificationSvc notificationSvc) {
        this.notificationSvc = notificationSvc;
    }

    /**
     * 로그인
     */
    public TxResponse<?> in(HttpServletRequest request, HttpServletResponse response, SharedMap<String, Object> param, TxResponse<?> txResponse) {
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


        List<SharedMap<String, Object>> rows = DummyRepository.of(MockNames.USER, TypeRegistry.LIST_SHAREDMAP_OBJECT);
        SharedMap<String, Object> userData = rows.stream().filter(row -> row.isEquals("id", id)).findFirst().orElseThrow(() -> new TxException(TxResultCode.INVALID_REQUEST, "가입 정보를 찾을 수 없습니다."));

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

        // 인증을 위한 OTP 시크릿키 준비
        String otpSecret = OtpUtil.getUserSecret(id);
        if (!CommonUtils.isEmpty(otpSecret)) {
            userData.put("otpSecret", otpSecret);
        }

        // 2차인증 준비
        String csrfRedisKey = MsgUtils.format(CSRF_FORMAT, csrf);
        RedisUtils.set(csrfRedisKey, userData, Duration.ofMinutes(5).getSeconds());

        // 2차 인증 확인
        if (!userData.isEquals("2fa", "active")) {
            createSession(request, response, userData);
            return new TxResponse<>(true, TxResultCode.SUCCESS.getCode(), param.getString("_csrf"), "/", userData);
        }


        // 2차 인증 레디스 생성
        return new TxResponse<>(true, TxResultCode.SUCCESS.getCode(), param.getString("_csrf"), "/sign/two-factor", userData);
    }

    /**
     * 2차 인증 화면 키 검증
     * 유효기간 5분 재 설정
     */
    public void twoFactorAuth(String key) {
        String csrfRedisKey = MsgUtils.format(CSRF_FORMAT, key);

        // 해당 레디스 키 존재하지 않음
        if (!RedisUtils.exists(csrfRedisKey)) {
            throw new TxException(TxResultCode.UNAUTHORIZED);
        }

        // 5분 재설정
        RedisUtils.pexpire(csrfRedisKey, Duration.ofMinutes(5).getSeconds() * 1000);
    }

    /**
     * 2차인증 발송
     * csrf -> 0ee5a5e909e026da80a392c61dfc314d
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
            throw new TxException(TxResultCode.UNAUTHORIZED, "인증 유효시간을 초과했습니다.");
        }

        boolean isOtpType = type.equalsIgnoreCase("otp");

        if (isOtpType) {
            String otpSecret = userMap.getString("otpSecret", "");
            if (CommonUtils.isEmpty(otpSecret)) {
                throw new TxException(TxResultCode.INVALID_REQUEST, "OTP 2차 인증이 등록되어 있지 않습니다.");
            }
        } else {
            notificationSvc.sendTwoFactorAuth(csrf, type, userMap.getString(type.toLowerCase(), ""));
        }

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
        boolean isOtpType = "OTP".equalsIgnoreCase(type);
        String csrf = param.getString("csrf");
        String code = param.getString("code");
        // 인증 코드 확인
        String twoFactorRedisKey = MsgUtils.format(NotificationSvc.TWO_FACTOR_FORMAT, type, csrf);
        // 유저 정보 확인
        String userRedisKey = MsgUtils.format(CSRF_FORMAT, csrf);

        if (!RedisUtils.exists(userRedisKey)) {
            throw new TxException(TxResultCode.UNAUTHORIZED, "이미 만료된 토큰입니다. 다시 로그인을 시도해주세요.");
        }

        if (!isOtpType && !RedisUtils.exists(twoFactorRedisKey)) {
            throw new TxException(TxResultCode.UNAUTHORIZED, "이미 만료된 토큰입니다. 다시 로그인을 시도해주세요.");
        }

        // 임시 세션내 유저 정보 조회
        SharedMap<String, Object> userMap = RedisUtils.get(userRedisKey, TypeRegistry.MAP_SHAREDMAP_OBJECT);
        if (CommonUtils.isEmpty(userMap)) {
            logger.info("인증 코드 일치 | 토큰 만료로인해 유저 정보 조회 실패");
            throw new TxException(TxResultCode.UNAUTHORIZED, "이미 만료된 토큰입니다. 다시 로그인을 시도해주세요.");
        }

        if (isOtpType) {
            String otpSecret = userMap.getString("otpSecret", "");
            if (CommonUtils.isEmpty(otpSecret) || !OtpUtil.validateOtp(otpSecret, code)) {
                throw new TxException(TxResultCode.INVALID_REQUEST, "OTP 코드가 일치하지 않습니다.");
            }
        } else {
            String twoFactorCode = RedisUtils.get(twoFactorRedisKey, TypeRegistry.STRING);
            if (!code.equals(twoFactorCode)) {
                throw new TxException(TxResultCode.INVALID_REQUEST, "인증 코드가 일치하지 않습니다.");
            }
        }

        // SESSION DATABASE 저장
        UserAgent ua = UADetect.set(headerMap.getString(HttpHeaders.USER_AGENT.toLowerCase()));
        // TODO: DB 저장 로직


        // 세션 생성
        createSession(request, response, userMap);
    }

    private static void createSession(HttpServletRequest request, HttpServletResponse response, SharedMap<String, Object> userMap) {
        String sessionId = SessionUtils.create(userMap.getString("id"), userMap);
        userMap.put("sessionId", sessionId);

        // 쿠키에 세션 데이터 저장
        CookieUtils.create(response, request.getHeader("host"), "/", Was.SESSION_ID, sessionId, Was.SESSION_EXPIRE, false, true);

        // 1일 짜리 세션 레디스 생성
        String oneDaySessionKey = MsgUtils.format(MsgUtils.format(Consts.Session.DAY_SESSION_STORE, sessionId));
        RedisUtils.set(oneDaySessionKey, userMap, Duration.ofDays(1).getSeconds());
    }

}
