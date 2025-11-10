package kr.tx24.fc.ctl;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class InitCtl {

    @GetMapping("/")
    public String dashboard() {
        return "pages/dashboard/admin";
    }

}
