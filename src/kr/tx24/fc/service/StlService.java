package kr.tx24.fc.service;

import kr.tx24.fc.bean.SearchBean;
import kr.tx24.fc.bean.SearchPage;
import kr.tx24.fc.bean.SearchResponse;
import kr.tx24.fc.repository.DummyRepository;
import kr.tx24.fc.enums.MockNames;
import kr.tx24.lib.map.SharedMap;
import org.springframework.stereotype.Service;
import org.springframework.ui.Model;

import java.util.List;

@Service
public class StlService {

    /**
     * 데이터 수집
     */
    public void dummyPaging(Model model, List<SearchBean> datas, SearchPage pages) {
        List<SharedMap<String, Object>> rows = DummyRepository.of(MockNames.CRAWL, datas);
        model.addAttribute("RLIST", new SearchResponse(rows, pages));
    }

}
