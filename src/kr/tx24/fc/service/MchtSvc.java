package kr.tx24.fc.service;

import kr.tx24.fc.bean.SearchBean;
import kr.tx24.fc.bean.SearchPage;
import kr.tx24.fc.bean.SearchResponse;
import kr.tx24.fc.enums.MockNames;
import kr.tx24.fc.repository.DummyRepository;
import kr.tx24.lib.map.SharedMap;
import org.springframework.stereotype.Service;
import org.springframework.ui.Model;

import java.util.List;

@Service
public class MchtSvc {

    public void paging(Model model, List<SearchBean> datas, SearchPage pages) {
        List<SharedMap<String, Object>> rows = DummyRepository.of(MockNames.MCHT, datas, pages);
        model.addAttribute("RLIST", new SearchResponse(rows, pages));
    }

    public void detailView(Model model, String mchtId) {

    }
}
