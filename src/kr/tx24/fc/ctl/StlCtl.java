package kr.tx24.fc.ctl;

import kr.tx24.fc.bean.SearchRequest;
import kr.tx24.fc.service.StlService;
import kr.tx24.was.annotation.SessionIgnore;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

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
    @PostMapping("/crawling/list")
    public String collectionSubmit(@RequestBody SearchRequest searchRequest, Model model){
        stlService.crawlPaging(model, searchRequest.datas, searchRequest.page);
        return "pages/stl/crawling/list";
    }

    @SessionIgnore
    @GetMapping("/trx")
    public String trxForm() {
        return "pages/stl/trx/form";
    }

    @SessionIgnore
    @PostMapping("/trx/list")
    public String trxList(@RequestBody SearchRequest searchRequest, Model model){
        stlService.trxPaging(model, searchRequest.datas, searchRequest.page);
        return "pages/stl/trx/list";
    }

    @SessionIgnore
    @GetMapping("/trx/{trxId}")
    public String collectionDetail(@PathVariable("trxId") String trxId, Model model){
        stlService.detailModal(trxId, model);
        return "pages/stl/trx/modal/view";
    }
}
