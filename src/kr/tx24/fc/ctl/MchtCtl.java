package kr.tx24.fc.ctl;

import kr.tx24.fc.bean.SearchRequest;
import kr.tx24.fc.service.MchtSvc;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

/**
 * NOTE
 * 고객사
 */
@Controller
@RequestMapping("/mcht")
public class MchtCtl {

    private final MchtSvc mchtSvc;

    public MchtCtl(MchtSvc mchtSvc) {
        this.mchtSvc = mchtSvc;
    }

    @GetMapping("/form")
    public String mchtForm() {
        return "pages/mcht/form";
    }

    @PostMapping("/list")
    public String mchtPage(@RequestBody SearchRequest searchRequest, Model model){
        mchtSvc.paging(model, searchRequest.datas, searchRequest.page);
        return "pages/mcht/list";
    }

    @GetMapping("/view")
    public String mchtView(Model model) {
        return "pages/mcht/view";
    }

    @GetMapping("/view/{mchtId}")
    public String mchtView(@PathVariable("mchtId") String mchtId, Model model) {
        mchtSvc.detailView(model, mchtId);
        return "pages/mcht/view";
    }
}
