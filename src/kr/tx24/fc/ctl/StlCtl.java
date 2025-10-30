package kr.tx24.fc.ctl;

import kr.tx24.fc.bean.SearchRequest;
import kr.tx24.fc.ctl.service.StlService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * 정산 컨트롤러
 */
@Controller
@RequestMapping("/stl")
public class StlCtl {

    private final StlService stlService;
    public StlCtl(StlService stlService) {
        this.stlService = stlService;
    }

    @GetMapping("/crawling")
    public String collectionForm() {
        return "pages/stl/crawling/form";
    }

    @PostMapping("/crawling")
    public String collectionSubmit(@RequestBody SearchRequest slRequest, Model model){
        stlService.dummyPaging(model, slRequest.datas, slRequest.page);
        return "pages/stl/crawling/result";
    }

}
