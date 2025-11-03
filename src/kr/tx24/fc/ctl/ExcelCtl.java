package kr.tx24.fc.ctl;

import kr.tx24.fc.bean.SearchBean;
import kr.tx24.fc.bean.TxResponse;
import kr.tx24.fc.service.ExcelService;
import kr.tx24.fc.enums.MockNames;
import kr.tx24.was.annotation.SessionIgnore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/excel")
public class ExcelCtl {

	private static final Logger logger = LoggerFactory.getLogger(ExcelCtl.class);
	private final ExcelService excelSvc;

	public ExcelCtl(ExcelService excelSvc) {
		this.excelSvc = excelSvc;
	}

	@SessionIgnore
	@PostMapping(value = "/stl/crawling/list" , produces = MediaType.APPLICATION_JSON_VALUE)
	public TxResponse<?> stlCrawlingList(@RequestBody List<SearchBean> datas) {
		logger.info("ExcelCtl.stlCrawlingList()");

		String link = excelSvc.excelDownloadLink(datas, MockNames.CRAWL);
		if (link == null) {
			return TxResponse.fail("엑셀 파일 생성에 실패했습니다.");
		}

		return TxResponse.ok(link);
	}
}
