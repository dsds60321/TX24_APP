package kr.tx24.fc.ctl;

import kr.tx24.fc.bean.SearchRequest;
import kr.tx24.fc.ctl.service.StlService;
import kr.tx24.was.annotation.SessionIgnore;
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

    @SessionIgnore
    @GetMapping("/crawling")
    public String collectionForm() {
        return "pages/stl/crawling/form";
    }

    @SessionIgnore
    @PostMapping(value = "/crawling/list")
    public String collectionSubmit(@RequestBody SearchRequest searchRequest, Model model){
        stlService.dummyPaging(model, searchRequest.datas, searchRequest.page);
        return "pages/stl/crawling/list";
    }
}
