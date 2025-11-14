package kr.tx24.fc.service;

import kr.tx24.fc.bean.SearchBean;
import kr.tx24.fc.bean.SearchPage;
import kr.tx24.fc.bean.SearchResponse;
import kr.tx24.fc.enums.TxResultCode;
import kr.tx24.fc.exception.TxException;
import kr.tx24.fc.repository.DummyRepository;
import kr.tx24.fc.enums.MockNames;
import kr.tx24.lib.map.SharedMap;
import kr.tx24.lib.map.TypeRegistry;
import org.springframework.stereotype.Service;
import org.springframework.ui.Model;

import java.util.List;

@Service
public class StlSvc {

    /**
     * 데이터 수집
     */
    public void crawlPaging(Model model, List<SearchBean> datas, SearchPage pages) {
        List<SharedMap<String, Object>> rows = DummyRepository.of(MockNames.CRAWL, datas, pages);
        model.addAttribute("RLIST", new SearchResponse(rows, pages));
    }

    /**
     * 정산
     */
    public void trxPaging(Model model, List<SearchBean> datas, SearchPage pages) {
        List<SharedMap<String, Object>> rows = DummyRepository.of(MockNames.TRX, datas, pages);
        model.addAttribute("RLIST", new SearchResponse(rows, pages));
    }

    /**
     * 모달 데이터 조회
     */
    public void detailModal(String trxId, Model model) {
        List<SharedMap<String, Object>> rows = DummyRepository.of(MockNames.TRX, TypeRegistry.LIST_SHAREDMAP_OBJECT);
        SharedMap<String, Object> data = rows.stream().filter(row -> row.isEquals("trxId", trxId))
                .findFirst()
                .orElseThrow(() -> new TxException(TxResultCode.NO_CONTENTS));

        model.addAttribute("DATA", data);
    }

}
