import './App.css';
import { useEffect, useState, useMemo } from 'react';
import { convertData } from './estatDataConverter';
import { flexRender, useReactTable, getCoreRowModel, getSortedRowModel } from '@tanstack/react-table';

const API_KEY = "96951ca8c1cc0a6a742e9f412d9cb99e7070d74a";
const STATS_DATA_ID = "0000010101";
const API_ENDPOINT = `https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData?cdArea=08000%2C09000%2C10000%2C11000%2C12000%2C13000%2C14000%2C19000&cdCat01=A1101&appId=${API_KEY}&lang=J&statsDataId=${STATS_DATA_ID}&metaGetFlg=Y&cntGetFlg=N&explanationGetFlg=Y&annotationGetFlg=Y&sectionHeaderFlg=1&replaceSpChars=0`;

const App = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(null);
  useEffect(() => {
    const fetchEstatData = async () => {
      setLoading(true);
      try {
        // e-Stat APIから首都圏の総人口情報を取得する
        const response = await fetch(API_ENDPOINT);
        if(!response.ok) {
          throw new Error ('HTTP error');
        }
        const json = await response.json();
        setData(json);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEstatData();
  }, []);

  const { header, tableData } = useMemo(() => {
    if (!data) {
        return { header: [], tableData: [] };
    }
    
    // 取得データを二次元配列(JSON)に変換
    const converted = convertData(data);
    
    const h = converted[0] || [];     // ヘッダー部
    const tData = converted.slice(1); // データ部
    
    return { header: h, tableData: tData };
  }, [data]);
  
  // TanStack Table の列定義
  // ヘッダー名から動的に作成
  const columns = useMemo(() => {
    if (header.length === 0) return [];

    return header.map((columnName, index) => ({
      // accessorKey: インデックスを設定
      accessorKey: String(index),
      // ヘッダー: 西暦,都道府県名を設定
      header: columnName,
      // セルの表示形式
      cell: info => {
        const value = info.getValue();
        if (index === 0) {
          return value;
        }
        // 人口を3桁区切りで表示
        if (typeof value === 'number') {
          return value.toLocaleString();
        }
        return value;
      },
      // スタイル設定 西暦は左寄せ、人口は右寄せ
      meta: {
        align: index === 0 ? 'left' : 'right',
      },
      // グループごとに背景色を設定
      style: {
        backgroundColor: columnName === '千葉県' || columnName === '山梨県' ? 'aqua'
         : columnName === '埼玉県' || columnName === '栃木県' ? 'yellow'
          : columnName === '西暦' ? 'white' : 'lime',
      },
    }));
  }, [header]);

  // useReactTable フックの実行
  const table = useReactTable({
    data: tableData,
    columns,
    // ソート設定 西暦降順
    initialState: {
      sorting: [{ id: 0, desc: true }],
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (loading) {
    return <p>⏳ データを取得中...</p>;
  }

  if (tableData.length === 0) {
    return <p>データがありません。</p>;
  }

  if (error) {
    return <p>システムエラー</p>;
  }

  // テーブルのレンダリング
  return (
    <div>
      <h2>都道府県別人口一覧</h2>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        {/* ヘッダーのレンダリング */}
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th
                  key={header.id}
                  style={{
                    textAlign: header.column.columnDef.meta?.align || 'left',
                  }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>

        {/* ボディのレンダリング */}
        <tbody>
          {table.getRowModel().rows.map(row => (
            <tr key={row.id}>
              {row.getVisibleCells().map(cell => (
                <td
                  key={cell.id}
                  style={{
                    // セルごとに設定したalign、背景色を取得
                    textAlign: cell.column.columnDef.meta?.align || 'left',
                    backgroundColor: cell.column.columnDef.style?.backgroundColor,
                  }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default App
