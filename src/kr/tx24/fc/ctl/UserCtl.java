package kr.tx24.fc.ctl;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import kr.tx24.fc.bean.TxResponse;
import kr.tx24.fc.consts.Consts;
import kr.tx24.fc.service.SessionSvc;
import kr.tx24.lib.lang.MsgUtils;
import kr.tx24.lib.map.SharedMap;
import kr.tx24.lib.redis.RedisUtils;
import kr.tx24.was.annotation.Session;
import kr.tx24.was.annotation.SessionIgnore;
import kr.tx24.was.util.SessionUtils;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;

@Controller
@RequestMapping("/user")
public class UserCtl {

    private final SessionSvc sessionSvc;

    public UserCtl(SessionSvc sessionSvc) {
        this.sessionSvc = sessionSvc;
    }

    // 유저 세션 데이터 요청
    @GetMapping("/session")
    public @ResponseBody TxResponse<?> getSession(@Session SharedMap<String, Object> session) {
        // 하루짜리 세션 갱신
        RedisUtils.set(MsgUtils.format(Consts.Session.DAY_SESSION_STORE, session.getString(SessionUtils.SESSION_ID)), session, Duration.ofDays(1).getSeconds()); // 하루짜리
        session.put("ttl", SessionUtils.getExpire(session.getString(SessionUtils.SESSION_ID)));
        session.remove("password");
        return TxResponse.ok(session);
    }

    /**
     * TODO: 세션이 완전 만료된 상황도 가능하게 변경 필요
     * @SessionIgnore로 받고 sessionId를 넣어주는걸로
     */
    @SessionIgnore
    @PostMapping("/session/extend")
    public @ResponseBody TxResponse<?> extendSession(HttpServletRequest request, HttpServletResponse response, @RequestBody SharedMap<String, Object> param) {
        return TxResponse.ok(sessionSvc.extendSession(request, response, param), "세션을 연장했습니다.");
    }
}
