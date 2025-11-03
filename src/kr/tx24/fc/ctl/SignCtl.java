package kr.tx24.fc.ctl;

import kr.tx24.fc.bean.TxResponse;
import kr.tx24.fc.service.SignSvc;
import kr.tx24.lib.lang.DateUtils;
import kr.tx24.was.annotation.SessionIgnore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/sign")
public class SignCtl {

    private static final Logger logger = LoggerFactory.getLogger(SignCtl.class);

    private final SignSvc signSvc;

    public SignCtl(SignSvc signSvc) {
        this.signSvc = signSvc;
    }

    @SessionIgnore
    @GetMapping("/in")
    public String loginForm(Model model) {
        model.addAttribute("_csrf", DateUtils.getCurrentDate());
        return "pages/sign/login";
    }

    @PostMapping("/in")
    public TxResponse<?> login() {

        return TxResponse.ok("");
    }
}
