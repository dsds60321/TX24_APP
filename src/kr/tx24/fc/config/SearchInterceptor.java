package kr.tx24.fc.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import kr.tx24.lib.lang.CommonUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * 요청에 대한 interceptor */
public class SearchInterceptor implements HandlerInterceptor {

	private static Logger logger = LoggerFactory.getLogger( SearchInterceptor.class );

	private static final String CONTENT_HEADER = "X-Request-Content";


	@Override
	public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
		logger.debug("SearchInterceptor preHandle {} {}", request.getMethod(), request.getRequestURI());
		String contentType = request.getHeader(CONTENT_HEADER);

		// 이미 /excel/ 로 들어온 요청은 그대로 진행
		if (request.getRequestURI().startsWith("/excel/") || CommonUtils.isEmpty(contentType)) {
			return true;
		}

		String forwardUrl = "/" + contentType + request.getRequestURI();
		logger.info("SearchInterceptor | Content : {} | forwardUrl {}", contentType, forwardUrl);

		request.getRequestDispatcher(forwardUrl).forward(request, response);
		return false;
	}
}
