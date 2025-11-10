package kr.tx24.fc.ctl;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import kr.tx24.fc.bean.TxResponse;
import kr.tx24.fc.enums.TxResultCode;
import kr.tx24.fc.service.SignService;
import kr.tx24.lib.lang.IDUtils;
import kr.tx24.lib.map.SharedMap;
import kr.tx24.lib.redis.RedisUtils;
import kr.tx24.was.annotation.Header;
import kr.tx24.was.annotation.SessionIgnore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;

@Controller
@RequestMapping("/sign")
public class SignCtl {

    private static final Logger logger = LoggerFactory.getLogger(SignCtl.class);

    private final SignService signService;

    public SignCtl(SignService signService) {
        this.signService = signService;
    }

    @SessionIgnore
    @GetMapping("/in")
    public String loginForm(Model model) {
        String csrf = IDUtils.genKey(16);
        RedisUtils.set(csrf, "", Duration.ofMinutes(5).getSeconds());
        logger.info("set csrf : {} ", csrf);
        model.addAttribute("_csrf", csrf);
        return "pages/sign/login2";
    }

    /**
     * 로그인
     */
    @SessionIgnore
    @PostMapping("/in")
    public @ResponseBody TxResponse<?> login(@RequestBody SharedMap<String, Object> param) {
        TxResponse<?> response = new TxResponse<>().link("/init").msg("아이디 또는 패스워드가 일치하지 않습니다.");
        response.code = TxResultCode.INVALID_REQUEST.getCode();
        return signService.in(param, response);
    }

    @SessionIgnore
    @PostMapping("/two-factor")
    public String twoFactorAuthForm(@RequestParam("_csrf") String _csrf, Model model) {
        model.addAttribute("_csrf", _csrf);
        signService.twoFactorAuth(_csrf);
        return "pages/sign/twoFactor2";
    }

    @SessionIgnore
    @PostMapping("/two-factor/code/send")
    public @ResponseBody TxResponse<?> sendTwoFactorAuthCode(@RequestBody SharedMap<String, Object> param) {
        signService.sendTwoFactorAuth(param);
        return TxResponse.okWithMsg("2차 인증번호를 발송했습니다.");
    }

    @SessionIgnore
    @PostMapping("/two-factor/code/verify")
    public @ResponseBody TxResponse<?> verifyTwoFactorAuthCode(HttpServletRequest request, HttpServletResponse response, @Header SharedMap<String,Object> headerMap, @RequestBody SharedMap<String, Object> param) {
        signService.verifyTwoFactorAuth(request, response, headerMap, param);
        return TxResponse.okWithMsg("2차 인증이 완료되었습니다.").link("/");
    }

}
