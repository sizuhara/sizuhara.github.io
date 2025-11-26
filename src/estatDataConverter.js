/**
 * e-Stat APIから取得したデータを、
 * [ [西暦, 北海道人口, 東京都人口, ...], [西暦, ..., ...], ...]
 * の形式の二次元配列（JSON）に変換する関数
 * @param {object} estatData e-Stat APIのレスポンスJSON
 * @returns {Array<Array<number | string>>} 変換された二次元配列
 */
export const convertData = (estatData) => {
    if (!estatData?.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE) {
        return [];
    }
    
    // 統計データの数値情報
    const {VALUE} = estatData.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF;
    // メタ情報 都道府県名が入る
    const CLASS_OBJ = estatData.GET_STATS_DATA.STATISTICAL_DATA.CLASS_INF.CLASS_OBJ;

    // 都道府県コードと名称をマッピング
    const areaObj = CLASS_OBJ.find(obj => obj['@id'] === 'area');
    const areaMap = areaObj?.CLASS?.reduce((map, item) => {
        map[item['@code']] = item['@name'];
        return map;
    }, {}) || {};

    // 年別、都道府県別に人口をマッピング
    const dataByYearAndPref = VALUE.reduce((acc, item) => {
        const year = item['@time'] ? item['@time'].substring(0,4) : 'unknown';
        const areaCode = item['@area'];
        const population = parseInt(item['$']) || 0;

        if (!acc[year]) {
            acc[year] = {};
        }
        const prefName = areaMap[areaCode] || `コード：${areaCode}`;
        acc[year][prefName] = population;

        return acc;
    }, {});

    // 都道府県名リストを作成し、ヘッダーに設定
    const allPrefectures = Array.from(
        new Set(Object.values(dataByYearAndPref).flatMap(yearData => Object.keys(yearData)))
    ).sort();
    const header = ['西暦', ...allPrefectures];

    // 二次元配列(JSON)作成
    const dataRows = Object.keys(dataByYearAndPref)
        .sort()
        .map(year => {
            const row = [year];
            const prefData = dataByYearAndPref[year];

            allPrefectures.forEach(pref => {
                row.push(prefData[pref] || 0);
            });

            return row;
        });
        return [header, ...dataRows];
};