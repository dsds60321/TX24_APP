package kr.tx24.fc.ctl;

import kr.tx24.fc.bean.TxResponse;
import kr.tx24.fc.enums.TxResultCode;
import kr.tx24.fc.service.SignService;
import kr.tx24.lib.lang.IDUtils;
import kr.tx24.lib.map.SharedMap;
import kr.tx24.lib.redis.RedisUtils;
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
        return "pages/sign/login";
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
    public String twoFactorAuthForm(@RequestParam("key") String key) {
        signService.twoFactorAuth(key);
        return "pages/sign/twoFactor";
    }

    @SessionIgnore
    @PostMapping("/two-factor/code/send")
    public TxResponse<?> sendTwoFactorAuthCode(@RequestBody SharedMap<String, Object> param) {
        return signService.isTwoFactorAuth(param) ? TxResponse.ok("2차 인증번호를 발송했습니다.") : TxResponse.fail("2차 인증번호 발송에 실패했습니다.");
    }

    @SessionIgnore
    @PostMapping("/two-factor/code/confirm")
    public TxResponse<?> confirmTwoFactorAuthCode(@RequestBody SharedMap<String, Object> param) {
        return signService.confirmTwoFactorAuth(param) ? TxResponse.ok("2차 인증번호 확인에 성공했습니다.") : TxResponse.fail("2차 인증번호 확인에 실패했습니다.");
    }
}
