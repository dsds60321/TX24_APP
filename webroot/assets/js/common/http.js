
export default class HttpClient {
	constructor() {
		this.instance = window.axios.create({
			baseURL: '/',
			headers: {
				'X-Requested-With' : 'XMLHttpRequest',
				'X-FromAjax' : 'true',
				'Content-Type': 'application/json'
			}
		});

		this.instance.interceptors.response.use(
			(response) => {
				console.log('[HTTP] response success', response.config.url, response.status);

				// 로그아웃 페이지 리다이렉트 경우
				const isLogout = response?.data?.code === 'TX401' || response?.status.toString() === '401';

				if (isLogout) {
					util.toastify.error('세션이 만료되었거나 정상적이지 않는 요청으로 인해 로그인 페이지로 이동합니다.');

					// 1초 뒤 리다이렉트
					setTimeout(() => {
						window.location.href = '/sign/in';
					}, 3000);

					// 이후 로직은 더 이상 실행할 필요 없음
					return Promise.reject(response);
				}

				sessionManager.init();
				return response;
			},
			(error) => {
				const { config, response } = error;
				console.log('[HTTP] response error', config && config.url, response && response.status);
				console.error('HTTP error', error);

				if (response.status === '401') {
					location.href = '/sign/in';
				}

				return Promise.reject(error);
			}
		);
	}

	get(url, config = {}) {
		return this.instance.get(url, config);
	}

	post(url, data = {}, config = {}) {
		return this.instance.post(url, data, config);
	}

	put(url, data = {}, config = {}) {
		return this.instance.put(url, data, config);
	}

	delete(url, config = {}) {
		return this.instance.delete(url, config);
	}
}
