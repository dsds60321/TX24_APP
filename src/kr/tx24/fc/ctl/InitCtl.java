package kr.tx24.fc.ctl;

import kr.tx24.lib.lang.CommonUtils;
import kr.tx24.lib.map.SharedMap;
import kr.tx24.was.annotation.Session;
import kr.tx24.was.annotation.SessionIgnore;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class InitCtl {

    @SessionIgnore
    @GetMapping({"/", "/init"})
    public String dashboard(@Session SharedMap<String, Object> session) {
        if (CommonUtils.isEmpty(session)) {
            return "redirect:/sign/in";
        }

        return "pages/dashboard/admin";
    }

}
