package kr.tx24.fc.ctl;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import kr.tx24.fc.bean.SearchRequest;
import kr.tx24.fc.bean.TxResponse;
import kr.tx24.fc.consts.Consts;
import kr.tx24.fc.service.SessionSvc;
import kr.tx24.fc.service.MemberSvc;
import kr.tx24.lib.lang.MsgUtils;
import kr.tx24.lib.map.SharedMap;
import kr.tx24.lib.redis.RedisUtils;
import kr.tx24.was.annotation.Session;
import kr.tx24.was.annotation.SessionIgnore;
import kr.tx24.was.util.SessionUtils;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;

@Controller
@RequestMapping("/member")
public class MemberCtl {

    private final MemberSvc memberSvc;
    private final SessionSvc sessionSvc;

    public MemberCtl(MemberSvc memberSvc, SessionSvc sessionSvc) {
        this.memberSvc = memberSvc;
        this.sessionSvc = sessionSvc;
    }

    @GetMapping("/check-id/{id}")
    public @ResponseBody TxResponse<?> checkId(@PathVariable("id") String id) {
        memberSvc.duplicateId(id);
        return TxResponse.okWithMsg("사용 가능한 아이디입니다.");
    }

    /**
     * NOTE
     * 회원 관리
     */
    @GetMapping("/admin/form")
    public String adminForm() {
        return "pages/member/admin/form";
    }

    @PostMapping("/admin/list")
    public String adminPage(@RequestBody SearchRequest searchRequest, Model model){
        memberSvc.adminPage(model, searchRequest.datas, searchRequest.page);
        return "pages/member/admin/list";
    }

    @GetMapping("/admin/add")
    public String adminAdd() {
        return "pages/member/admin/add";
    }

    @PostMapping("/admin/add")
    public @ResponseBody TxResponse<?> adminAdd(@RequestBody SharedMap<String, Object> param) {
        memberSvc.adminAdd(param);
        return TxResponse.okWithMsg("회원을 등록했습니다.");
    }

    /**
     * NOTE
     * 상단 프로필
     */
    @GetMapping("/profile")
    public String profile(@Session SharedMap<String,Object> session, Model model) {
        memberSvc.profile(session, model);
        return "pages/member/profile";
    }

    @PostMapping("/profile/update")
    public @ResponseBody TxResponse<?> updateProfile(@Session SharedMap<String,Object> session, @RequestBody SharedMap<String, Object> param) {
        return TxResponse.ok(memberSvc.updateProfile(session, param), "프로필을 수정했습니다.");
    }

    /**
     * NOTE
     * 사용자 세션 관리
     */
    @GetMapping("/session")
    public @ResponseBody TxResponse<?> getSession(@Session SharedMap<String, Object> session) {
        // 하루짜리 세션 갱신
        RedisUtils.set(MsgUtils.format(Consts.Session.DAY_SESSION_STORE, session.getString(SessionUtils.SESSION_ID)), session, Duration.ofDays(1).getSeconds()); // 하루짜리
        session.put("ttl", SessionUtils.getExpire(session.getString(SessionUtils.SESSION_ID)));
        session.remove("password");
        return TxResponse.ok(session);
    }

    /**
     */
    @SessionIgnore
    @PostMapping("/session/extend")
    public @ResponseBody TxResponse<?> extendSession(HttpServletRequest request, HttpServletResponse response, @RequestBody SharedMap<String, Object> param) {
        return TxResponse.ok(sessionSvc.extendSession(request, response, param), "세션을 연장했습니다.");
    }
}
