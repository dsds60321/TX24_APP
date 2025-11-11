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
import kr.tx24.lib.map.TypeRegistry;
import kr.tx24.lib.redis.RedisUtils;
import kr.tx24.was.util.CookieUtils;
import kr.tx24.was.util.SessionUtils;
import kr.tx24.was.util.Was;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;

/**
 * lib 에 있는 interceptor에서 세션을 죽여서 하루짜리 세션 의미가 없음
 */
@Service
public class SessionSvc {

    public SharedMap<String,Object> extendSession(HttpServletRequest request, HttpServletResponse response, SharedMap<String, Object> param) {
        // 유저 정보 조회 + 패스워드 확인 -> 세션 연장
        if (CommonUtils.hasEmptyValue(param, List.of("userId", "password", "sessionId"))) {
            throw new TxException(TxResultCode.INVALID_REQUEST, "유저 정보를 찾을 수 없습니다. 다시 로그인 하여 진행해주세요.");
        }

        String userId = param.getString("userId");
        String pw = param.getString("password");
        String sessionId = param.getString("sessionId");

        // TODO : DB 조회시 아이디 등 검증
        List<SharedMap<String, Object>> rows = DummyRepository.of(MockNames.USER, TypeRegistry.LIST_SHAREDMAP_OBJECT);
        SharedMap<String, Object> userMap = rows.stream().filter(row -> row.isEquals("id", userId)).findFirst().orElseThrow(() -> new TxException(TxResultCode.INVALID_REQUEST, "가입 정보를 찾을 수 없습니다."));
        String hashedPw = userMap.getString("password"); // 기존 패스워드

        // 기존 세션 있을 경우
        if (SessionUtils.exists(sessionId)) {

            if (!Argon2.fastVerify(pw, hashedPw)) {
                throw new TxException(TxResultCode.INVALID_REQUEST, "패스워드를 다시 확인 후 시도해주세요.");
            }

            SharedMap<String, Object> sessionMap = SessionUtils.getBySessionId(sessionId);
            sessionMap.put("ttl", SessionUtils.getExpire(sessionId));
            return sessionMap;
        }

        // 기존 세션도 없는 경우 하루 짜리에서 가져온다
        if (RedisUtils.exists(MsgUtils.format(Consts.Session.DAY_SESSION_STORE, sessionId))) {

            if (!Argon2.fastVerify(pw, hashedPw)) {
                throw new TxException(TxResultCode.INVALID_REQUEST, "패스워드를 다시 확인 후 시도해주세요.");
            }

            // 세션 재 생성
            CookieUtils.create(response, request.getHeader("host"), "/", Was.SESSION_ID, sessionId, Was.SESSION_EXPIRE, false, true);

            // 기존 세션 레디스 + 하루 짜리 임시 데이터 재 생성

            RedisUtils.set(MsgUtils.format(Consts.Session.SESSION_STORE, sessionId), userMap, Was.SESSION_EXPIRE); // 기존 세션
            RedisUtils.set(MsgUtils.format(Consts.Session.DAY_SESSION_STORE, sessionId), userMap, Duration.ofDays(1).getSeconds()); // 하루짜리

            SharedMap<String, Object> sessionMap = SessionUtils.getBySessionId(sessionId);
            sessionMap.put("ttl", SessionUtils.getExpire(sessionId));
            return sessionMap;
        }

        // 세션 연장 실패
        throw new TxException(TxResultCode.UNAUTHORIZED, "세션 재생성 실패, 로그인 페이지로 이동합니다.");
    }

    /**
     * 세션 삭제
     */
    public void logout(SharedMap<String, Object> session) {
        if (CommonUtils.isEmpty(session)) {
            return;
        }

        if (session.isBlank(SessionUtils.SESSION_ID)) {
            return;
        }

        String sessionId = session.getString(SessionUtils.SESSION_ID);

        String sessionKey = MsgUtils.format(Consts.Session.SESSION_STORE, sessionId);
        String sessionDayKey = MsgUtils.format(Consts.Session.DAY_SESSION_STORE, sessionId);


        // 기본 세션
        if (RedisUtils.exists(sessionKey)) {
            RedisUtils.del(sessionKey);
        }

        // 하루 짜리 세션
        if (RedisUtils.exists(sessionDayKey)) {
            RedisUtils.del(sessionDayKey);
        }
    }
}
