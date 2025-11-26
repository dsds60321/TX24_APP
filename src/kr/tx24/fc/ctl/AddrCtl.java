package kr.tx24.fc.ctl;

import kr.tx24.fc.service.AddrSvc;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/addr")
public class AddrCtl {

    private final AddrSvc addrSvc;

    public AddrCtl(AddrSvc addrSvc) {
        this.addrSvc = addrSvc;
    }

    @GetMapping("/list/{id}")
    public String detailView(@PathVariable("id") String id) {
        return "pages/address/view";
    }

}
