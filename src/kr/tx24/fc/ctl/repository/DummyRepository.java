package kr.tx24.fc.ctl.repository;

import kr.tx24.lib.map.SharedMap;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class DummyRepository {

    public static List<SharedMap<String, Object>> ofCrawl() {
        List<SharedMap<String, Object>> rows = null;
        for (int i = 0; i < 100; i++) {
            SharedMap<String, Object> map = new SharedMap<>();
            map.put("day", "test");
            rows.add(map);
        }

        return rows;
    }

}
