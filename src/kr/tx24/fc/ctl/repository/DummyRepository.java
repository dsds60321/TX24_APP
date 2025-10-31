package kr.tx24.fc.ctl.repository;

import kr.tx24.fc.bean.SearchBean;
import kr.tx24.fc.bean.SearchPage;
import kr.tx24.lib.lang.DateUtils;
import kr.tx24.lib.map.SharedMap;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Repository
public class DummyRepository {

	/**
	 * 크롤링 더미
	 */
	public static List<SharedMap<String, Object>> ofCrawl(List<SearchBean> datas, SearchPage page) {

		// Mock 데이터
		List<SharedMap<String, Object>> rows = new ArrayList<>();
		for (int i = 0; i < 100; i++) {
			SharedMap<String, Object> map = new SharedMap<>();
			map.put("idx", i + 1);
			map.put("stlId", String.format("STL-%04d", i + 1));
			map.put("mid", String.format("MID-%04d", i + 1));
			map.put("appId", String.format("APP-%04d", i + 1));
			map.put("regDate", DateUtils.getCurrentDate("yyyy-MM-dd"));
			rows.add(map);
		}

		// 검색
		return search(rows, datas, page);
	}


	/**
	 * 검색
	 */
	private static List<SharedMap<String, Object>> search(List<SharedMap<String, Object>> rows, List<SearchBean> datas, SearchPage page) {
		page.totalSize = rows.size();
		rows.stream()
				.filter(row ->
						datas.stream().allMatch(data -> row.isEquals(data.id, data.value))
				)
				.collect(Collectors.toList());
		return rows.stream().skip(page.rowsPerPage * page.selectedPage).limit(page.rowsPerPage).toList(); // paging 쿼리
	}
}
