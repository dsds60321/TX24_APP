package kr.tx24.fc.service;

import kr.tx24.fc.bean.SearchBean;
import kr.tx24.fc.bean.SearchPage;
import kr.tx24.fc.bean.SearchResponse;
import kr.tx24.fc.enums.MockNames;
import kr.tx24.fc.enums.TxResultCode;
import kr.tx24.fc.exception.TxException;
import kr.tx24.fc.repository.DummyRepository;
import kr.tx24.fc.util.OtpUtil;
import kr.tx24.fc.util.OtpUtil.OtpProvisioning;
import kr.tx24.lib.lang.CommonUtils;
import kr.tx24.lib.map.SharedMap;
import kr.tx24.lib.map.TypeRegistry;
import org.springframework.stereotype.Service;
import org.springframework.ui.Model;

import java.util.Base64;
import java.util.List;

@Service
public class MemberSvc {


	/**
	 * MEMO
	 * 유저 아이디 중복 체크
	 */
	public void duplicateId(String id) {
		List<SharedMap<String,Object>> rows = DummyRepository.of(MockNames.USER, TypeRegistry.LIST_SHAREDMAP_OBJECT);
		boolean exists = rows.stream().anyMatch(user -> user.isEquals("id", id));

		if (exists) {
			throw new TxException(TxResultCode.INVALID_REQUEST, "이미 사용중인 아이디입니다.");
		}
	}

	/**
	 * MEMO
	 * 사용자 프로필 조회
	 */
	public void profile(SharedMap<String, Object> session, Model model) {
		String userId = session.getString("session_userId");
		List<SharedMap<String, Object>> users = DummyRepository.of(MockNames.USER, TypeRegistry.LIST_SHAREDMAP_OBJECT);
		SharedMap<String, Object> userMap = users.stream()
			.filter(user -> user.isEquals("id", userId))
			.findFirst()
			.orElseThrow(() -> new TxException(TxResultCode.UNAUTHORIZED, "유저 정보를 찾을 수 없습니다."));

		String accountName = userMap.getString("email");
		if (CommonUtils.isEmpty(accountName)) {
			accountName = userId;
		}

		String otpSecret = OtpUtil.getOrCreateUserSecret(userId);
		OtpProvisioning provisioning = OtpUtil.provisioningFromSecret(accountName, otpSecret);
		String qrBase64 = Base64.getEncoder().encodeToString(provisioning.getQrImageBytes());

		userMap.put("otpSecret", otpSecret);
		model.addAttribute("USER", userMap);
		model.addAttribute("otpQrBase64", qrBase64);
		model.addAttribute("otpAuthUrl", provisioning.getOtpAuthUrl());
	}

	/**
	 * MEMO
	 * 사용자 업데이트
	 */
	public SharedMap<String, Object> updateProfile(SharedMap<String, Object> session, SharedMap<String, Object> param) {
		if (session.isBlank("session_userId")) {
			throw new TxException(TxResultCode.INVALID_REQUEST, "id는 필수값입니다.");
		}

		String userId = session.getString("session_userId");

		List<SharedMap<String, Object>> users = DummyRepository.of(MockNames.USER, TypeRegistry.LIST_SHAREDMAP_OBJECT);
		SharedMap<String, Object> userMap = users.stream()
				.filter(user -> user.isEquals("id", userId))
				.findFirst()
				.orElseThrow(() -> new TxException(TxResultCode.UNAUTHORIZED, "유저 정보를 찾을 수 없습니다."));


		userMap.putAll(param);
		return userMap;
	}

	public void adminPage(Model model, List<SearchBean> datas, SearchPage page) {
		List<SharedMap<String, Object>> rows = DummyRepository.of(MockNames.USER, datas, page);
		model.addAttribute("RLIST", new SearchResponse(rows, page));
	}
}
