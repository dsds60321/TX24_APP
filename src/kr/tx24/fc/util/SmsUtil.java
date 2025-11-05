package kr.tx24.fc.util;

import kr.tx24.lib.map.SharedMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class SmsUtil {

    private static Logger logger = LoggerFactory.getLogger(SmsUtil.class);
    private static final String SENDER_NUMBER = "16004191";

    public static boolean sendSms(String receiver, String message) {
        logger.info(" receiver : {}, message : {}", receiver, message);
        return true;
    }
}
