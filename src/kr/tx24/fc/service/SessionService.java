package kr.tx24.fc.service;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import kr.tx24.fc.consts.Consts;
import kr.tx24.fc.enums.MockNames;
import kr.tx24.fc.enums.TxResultCode;
import kr.tx24.fc.exception.TxException;
import kr.tx24.fc.repository.DummyRepository;
import kr.tx24.lib.crypt.Argon2;
import kr.tx24.lib.lang.CommonUtils;
import kr.tx24.lib.lang.MsgUtils;
import kr.tx24.lib.map.SharedMap;
import kr.tx24.lib.redis.RedisUtils;
import kr.tx24.was.util.CookieUtils;
import kr.tx24.was.util.SessionUtils;
import kr.tx24.was.util.Was;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;

@Service
public class SessionService {

    public SharedMap<String,Object> extendSession(HttpServletRequest request, HttpServletResponse response, SharedMap<String, Object> headerMap,SharedMap<String, Object> param) {
        // 유저 정보 조회 + 패스워드 확인 -> 세션 연장
        if (CommonUtils.hasEmptyValue(param, List.of("userId", "password", "sessionId"))) {
            throw new TxException(TxResultCode.INVALID_REQUEST, "유저 정보를 찾을 수 없습니다. 다시 로그인 하여 진행해주세요.");
        }

        String userId = param.getString("userId");
        String pw = param.getString("password");
        String sessionId = param.getString("sessionId");

        // 기존 세션 있을 경우
        if (SessionUtils.exists(sessionId)) {

            // ID로 해당 계정 조회 세션과 동일 여부 확인
            SharedMap<String, Object> userMap = DummyRepository.of(MockNames.USER);


            if (!Argon2.fastVerify(pw, userMap.getString("password"))) {
                throw new TxException(TxResultCode.INVALID_REQUEST, "패스워드를 다시 확인 후 시도해주세요.");
            }

            return SessionUtils.getBySessionId(sessionId);
        }

        // 기존 세션도 없는 경우 하루 짜리에서 가져온다
        if (RedisUtils.exists(MsgUtils.format(Consts.Session.DAY_SESSION_STORE, sessionId))) {
            // ID로 해당 계정 조회 세션과 동일 여부 확인
            SharedMap<String, Object> userMap = DummyRepository.of(MockNames.USER);

            if (!Argon2.fastVerify(pw, userMap.getString("password"))) {
                throw new TxException(TxResultCode.INVALID_REQUEST, "패스워드를 다시 확인 후 시도해주세요.");
            }

            // 세션 재 생성
            CookieUtils.create(response, request.getHeader("host"), "/", Was.SESSION_ID, sessionId, Was.SESSION_EXPIRE, false, true);

            // 기존 세션 레디스 + 하루 짜리 임시 데이터 재 생성
            RedisUtils.set("WSDATA|" + sessionId, userMap, Was.SESSION_EXPIRE); // 기존 세션
            RedisUtils.set(MsgUtils.format(Consts.Session.DAY_SESSION_STORE, sessionId), userMap, Duration.ofDays(1).getSeconds()); // 하루짜리
            return SessionUtils.getBySessionId(sessionId);
        }

        return null;
    }
}
