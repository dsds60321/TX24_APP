package kr.tx24.fc.service;

import kr.tx24.fc.bean.SearchBean;
import kr.tx24.fc.repository.DummyRepository;
import kr.tx24.fc.enums.MockNames;
import kr.tx24.fc.util.ExcelUtils;
import kr.tx24.lib.lang.CommonUtils;
import kr.tx24.lib.map.MapFactory;
import kr.tx24.lib.map.SharedMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;

/**
 * 엑셀 서비스
 */
@Service
public class ExcelSvc {

	private static final Logger logger = LoggerFactory.getLogger(ExcelSvc.class);

	public String excelDownloadLink(List<SearchBean> datas, MockNames mockNames) {
		if (mockNames == null) {
			return null;
		}

		switch (mockNames) {
			case CRAWL:
				try {
					List<SharedMap<String, Object>> rows = DummyRepository.of(MockNames.CRAWL, datas);
					return ExcelUtils.createWorkbook("Settlement", getHeaders(mockNames), rows);

				} catch (Exception e) {
					logger.info("Exception : {} " , CommonUtils.getExceptionMessage(e, 1000));
					return null;
				}

			case DFA:
				return null;
			default:
				return null;
		}
	}


	private LinkedHashMap<String, Object> getHeaders(MockNames mockNames) {
		LinkedHashMap<String,Object> map = MapFactory.createObjectMap(LinkedHashMap.class);
		switch (mockNames) {
			case CRAWL:
				map.put("stlId", "정산번호");
				map.put("mid", "MID");
				map.put("appId", "앱아이디");
				map.put("regDate", "등록일시");
				map.put("status", "상태");
				map.put("amount", "금액");
				break;
			default:
				break;
		}
		return map;
	}
}
