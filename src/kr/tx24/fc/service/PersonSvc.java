package kr.tx24.fc.service;

import kr.tx24.fc.enums.MockNames;
import kr.tx24.fc.repository.DummyRepository;
import kr.tx24.lib.lang.CommonUtils;
import kr.tx24.lib.map.SharedMap;
import kr.tx24.lib.map.TypeRegistry;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PersonSvc {


    public List<SharedMap<String, Object>> getList(String id, String type) {
        List<SharedMap<String, Object>> rows =
                DummyRepository.of(MockNames.PERSON, TypeRegistry.LIST_SHAREDMAP_OBJECT);

        return rows.stream()
                .filter(row -> row.isEquals("id", id))
                .filter(row -> CommonUtils.isEmpty(type) || row.isEquals("type", type))
                .collect(Collectors.toList());
    }
}
