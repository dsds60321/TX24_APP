package kr.tx24.fc.service;

import kr.tx24.fc.enums.MockNames;
import kr.tx24.fc.enums.TxResultCode;
import kr.tx24.fc.exception.TxException;
import kr.tx24.fc.repository.DummyRepository;
import kr.tx24.lib.lang.CommonUtils;
import kr.tx24.lib.map.SharedMap;
import kr.tx24.lib.map.TypeRegistry;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AddrSvc {

    public List<SharedMap<String, Object>> getList(String refId, String refType) {
        String mappedRefType = switch (refType.toLowerCase()) {
            case "ubo" -> "PERSON_UBO";
            case "mcht" -> "MCHT";
            default -> throw new TxException(TxResultCode.NO_CONTENTS);
        };

        List<SharedMap<String, Object>> rows =
                DummyRepository.of(MockNames.UBO, TypeRegistry.LIST_SHAREDMAP_OBJECT);

        return rows.stream()
                .filter(row -> row.isEquals("refId", refId))
                .filter(row -> CommonUtils.isEmpty(mappedRefType) || row.isEquals("type", mappedRefType))
                .collect(Collectors.toList());
    }
}
