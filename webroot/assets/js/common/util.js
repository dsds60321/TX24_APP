const util = {
    pad: function (n, width, z) {
        z = z || '0';
        n = n + '';
        return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
    },
    dateUtil : {
        toString: function (date) {
            console.log(date);
            if (!date) date = new Date();
            return date.getFullYear() + "-" + (util.pad(date.getMonth() + 1, 2)) + "-" + util.pad(date.getDate(), 2);
        },
        getNowDate: function (separator) {
            var nowDate = new Date();
            var yesterDate = new Date(nowDate.setDate(nowDate.getDate()))
            var yDay = yesterDate.getDate();
            var yMonth = yesterDate.getMonth()+1;
            var yYear = yesterDate.getFullYear();
            var startDt = new Date(yYear, nowDate.getMonth(), 1);
            var firstDate = startDt.getDate();
            if (yDay < 10) {
                yDay = '0' + yDay;
            }
            if (yMonth < 10) {
                yMonth = '0' + yMonth;
            }

            if (separator) {
                return yYear + separator + yMonth + separator + yDay;
            }

            return yYear + yMonth + yDay;
        },
    }
}