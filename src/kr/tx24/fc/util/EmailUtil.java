package kr.tx24.fc.util;

import kr.tx24.lib.map.SharedMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;

public class EmailUtil {

    private static Logger logger = LoggerFactory.getLogger(EmailUtil.class);

    public static boolean sendEmail(List<String> to, String from, String subject, String content) {
        logger.info("to : {}, from : {}, subject : {}, content : {}", to, from, subject, content);
        // 이메일 전송 로직
        return true;
    }
}
