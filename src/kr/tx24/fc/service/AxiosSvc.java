package kr.tx24.fc.service;

import kr.tx24.fc.enums.MockNames;
import kr.tx24.fc.repository.DummyRepository;
import kr.tx24.lib.lang.CommonUtils;
import kr.tx24.lib.map.SharedMap;
import kr.tx24.lib.map.TypeRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AxiosSvc {

    private final Logger logger = LoggerFactory.getLogger(AxiosSvc.class);

    public <T>T suggest(Map<String, Object> param) {
        String q = param.get("q").toString();
        String k = param.get("k").toString(); // 조건 컬럼
        String v = param.get("v").toString(); // value
        List<SharedMap<String, Object>> rows = new ArrayList<>();

        switch (q) {
            case "mcht" -> {
                rows = DummyRepository.of(MockNames.MCHT, TypeRegistry.LIST_SHAREDMAP_OBJECT);
                return suggestSearch(rows, k, v);
            }
            case "app" -> {
                rows = DummyRepository.of(MockNames.APP, TypeRegistry.LIST_SHAREDMAP_OBJECT);
                return suggestSearch(rows, k, v);
            }

            case "user" -> {
                rows = DummyRepository.of(MockNames.USER, TypeRegistry.LIST_SHAREDMAP_OBJECT);
                return suggestSearch(rows, k, v);
            }
        }

        return null;
    }


    private <T>T suggestSearch(List<SharedMap<String, Object>> rows, String k, String v) {
        return (T) rows.stream()
                .filter(row -> {
                    String target = row.getString(k);
                    return target != null && target.toLowerCase().contains(v.toLowerCase());
                }).toList();
    }
}
