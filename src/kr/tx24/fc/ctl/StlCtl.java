package kr.tx24.fc.ctl;

import kr.tx24.fc.bean.SearchRequest;
import kr.tx24.fc.service.StlSvc;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

/**
 * 정산 컨트롤러
 */
@Controller
@RequestMapping("/stl")
public class StlCtl {

    private final StlSvc stlSvc;
    public StlCtl(StlSvc stlSvc) {
        this.stlSvc = stlSvc;
    }

    @GetMapping("/crawling")
    public String collectionForm() {
        return "pages/stl/crawling/form";
    }

    @PostMapping("/crawling/list")
    public String collectionPage(@RequestBody SearchRequest searchRequest, Model model){
        stlSvc.crawlPaging(model, searchRequest.datas, searchRequest.page);
        return "pages/stl/crawling/list";
    }

    @GetMapping("/trx")
    public String trxForm() {
        return "pages/stl/trx/form";
    }

    @PostMapping("/trx/list")
    public String trxList(@RequestBody SearchRequest searchRequest, Model model){
        stlSvc.trxPaging(model, searchRequest.datas, searchRequest.page);
        return "pages/stl/trx/list";
    }

    @GetMapping("/trx/{trxId}")
    public String collectionDetail(@PathVariable("trxId") String trxId, Model model){
        stlSvc.detailModal(trxId, model);
        return "pages/stl/trx/modal/view";
    }
}
