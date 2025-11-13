package kr.tx24.fc.ctl.advice;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import kr.tx24.fc.bean.TxResponse;
import kr.tx24.fc.enums.TxResultCode;
import kr.tx24.fc.exception.TxException;
import kr.tx24.lib.lang.CommonUtils;
import kr.tx24.was.util.Was;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.servlet.NoHandlerFoundException;

/**
 * 예외 핸들러
 */
@ControllerAdvice
public class AppExceptionHandler {

    private static final Logger logger 	= LoggerFactory.getLogger(AppExceptionHandler.class);

	@ExceptionHandler(NoHandlerFoundException.class)
    public String handleNoHandlerFound(NoHandlerFoundException ex) {
        logger.info("Exception : {}", CommonUtils.getExceptionMessage(ex,1000));
        return "redirect:/";
    }
  
    // (2) 기본 404 처리 (예외 안 던지는 경우 - 직접 ResponseStatusExceptionResolver와 매핑)
    @ExceptionHandler
    public ResponseEntity<String> handleAnyOther(Exception ex) {
        logger.info("Exception : {}", CommonUtils.getExceptionMessage(ex,1000));
        if (ex instanceof org.springframework.web.servlet.resource.NoResourceFoundException) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body("Custom 404 (NoResourceFoundException) - Resource Not Found");
        }
        // 그 외 예외는 500 처리
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Custom 500 - " + ex.getMessage());
    }

    /**
     * 공통 예외 처리
     * TxResultCode
     *   - resultCode >= 400 : warn
     *   - resultCode < 400 : info
     */
    @ExceptionHandler(TxException.class)
    public ResponseEntity<TxResponse<?>> handleTxException(HttpServletRequest request, HttpServletResponse response, TxException ex) {
        boolean isAxios = Was.getHeader(request, "X-Requested-With").equalsIgnoreCase("xmlhttprequest")
                || Was.getHeader(request,"X-FromAjax").equals("true");

        TxResultCode resultCode = ex.getResultCode();
        int numericCode = resultCode.getNumericCode();

        String exceptionMessage = CommonUtils.getExceptionMessage(ex, 1000);

        // 401 오류에 대한
        try {
            // SUBMIT에만 redirect 진행됨
            if (!isAxios && numericCode == 401) {
                logger.info("Session Expired OR CSRF Token Invalid : {} ", exceptionMessage );
                response.sendRedirect("/sign/in");
                return null;
            }
        } catch (Exception e) {
            logger.warn("handleTxException | sendRedirect error : {} ", CommonUtils.getExceptionMessage(e, 1000));
            return ResponseEntity.ok(TxResponse.fail(resultCode, ex.getErrorMessage()));
        }


		if (numericCode >= 400) {
			logger.warn("handleTxException | CODE [{}] | : {}",numericCode, exceptionMessage);
		} else {
			logger.info("handleTxException | CODE [{}] : {}", numericCode, exceptionMessage);
		}

		// 항상 200 처리
		return ResponseEntity.ok(TxResponse.fail(resultCode, ex.getErrorMessage()));
	}

}
