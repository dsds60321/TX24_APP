package kr.tx24.fc.service;

import kr.tx24.fc.enums.MockNames;
import kr.tx24.fc.enums.TxResultCode;
import kr.tx24.fc.exception.TxException;
import kr.tx24.fc.repository.DummyRepository;
import kr.tx24.fc.util.EmailUtil;
import kr.tx24.fc.util.SmsUtil;
import kr.tx24.lib.lang.IDUtils;
import kr.tx24.lib.lang.MsgUtils;
import kr.tx24.lib.map.MapFactory;
import kr.tx24.lib.map.SharedMap;
import kr.tx24.lib.redis.RedisUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {


    private final Logger logger = LoggerFactory.getLogger(NotificationService.class);
    private static final String TWO_FACTOR = "TWO_FACTOR:%s";

    /**
     * 2차 인증 발송
     */
    public void sendTwoFactorAuth(String type, String to) {
        type = type.toUpperCase();

        try {
            if (RedisUtils.exists(TWO_FACTOR.formatted(to))) {
                throw new TxException(TxResultCode.INVALID_REQUEST, "이미 발송된 요청입니다.");
            }

            List<SharedMap<String, Object>> rows = DummyRepository.list(MockNames.TMPL);
            String finalType = type;

            // 2차 인증 타입 확인
            SharedMap<String, Object> tmplMap = rows.stream()
                    .filter(row ->
                            row.isEquals("id", "TWO_FACTOR") &&
                                    row.isEquals("msgType", finalType))
                    .findFirst()
                    .orElseThrow(() -> new TxException(TxResultCode.INTERNAL_ERROR, "2차인증 요청에 가능한 타입이 없습니다."));

            String content = tmplMap.getString("tmpl");
            String randomKey = IDUtils.genKey(6);
            logger.info("TWO_FACTOR SEND | TO : {} : value : {} ", to, randomKey);
            content = MsgUtils.format(content, IDUtils.genKey(6));


            // 2차인증 전송
            switch (type) {
                case "EMAIL" -> EmailUtil.sendEmail(List.of(to)
                        , tmplMap.getString("from")
                        , tmplMap.getString("subject")
                        , content);

                case "SMS" -> SmsUtil.sendSms(tmplMap.getString("sender")
                        , content);

                default -> logger.info("sendTwoFactorAuth");
            }

            // 2차 인증 번호 REDIS 5분
            RedisUtils.set(MsgUtils.format(TWO_FACTOR, randomKey), "", 300);
        } catch (Exception e) {
            logger.info("sendTwoFactorAuth error : {} ", e.getMessage());
            RedisUtils.del(MsgUtils.format(TWO_FACTOR, to));
            throw new TxException(TxResultCode.INTERNAL_ERROR, "2차인증 요청에 실패했습니다.");
        }
    }


}
