package kr.tx24.fc.ctl;

import kr.tx24.was.annotation.SessionIgnore;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class InitCtl {

    @SessionIgnore
    @GetMapping("/")
    public String dashboard() {
        return "pages/dashboard/admin";
    }

}
