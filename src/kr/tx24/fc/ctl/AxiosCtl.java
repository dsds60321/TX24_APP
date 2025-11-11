package kr.tx24.fc.ctl;

import kr.tx24.fc.bean.TxResponse;
import kr.tx24.fc.service.AxiosSvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/axios")
public class AxiosCtl {

    private final AxiosSvc axiosSvc;

    public AxiosCtl(AxiosSvc axiosSvc) {
        this.axiosSvc = axiosSvc;
    }

    @GetMapping("/suggest")
    public TxResponse<?> suggest(@RequestParam Map<String, Object> params) {
        return TxResponse.ok(axiosSvc.suggest(params));
    }
}
