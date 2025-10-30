package kr.tx24.fc.ctl.service;

import kr.tx24.fc.bean.SearchBean;
import kr.tx24.fc.bean.SearchPage;
import kr.tx24.fc.ctl.repository.DummyRepository;
import org.springframework.stereotype.Service;
import org.springframework.ui.Model;

import java.util.List;

@Service
public class StlService {

    private final DummyRepository dummyRepository;
    public StlService(DummyRepository dummyRepository) {
        this.dummyRepository = dummyRepository;
    }

    public void dummyPaging(Model model, List<SearchBean> datas, SearchPage page) {
        model.addAttribute("SLIST", dummyRepository.ofCrawl());
    }
}
