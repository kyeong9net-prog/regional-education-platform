/**
 * Phase 6: 데이터 내보내기 유틸리티
 * CSV와 PDF 형식으로 통계 데이터를 내보냅니다.
 */

/**
 * CSV 파일로 내보내기
 */
export function exportToCSV(data: any[], filename: string = 'export.csv') {
  if (data.length === 0) {
    alert('내보낼 데이터가 없습니다.');
    return;
  }

  // 헤더 추출
  const headers = Object.keys(data[0]);

  // CSV 문자열 생성
  const csvContent = [
    // 헤더 행
    headers.join(','),
    // 데이터 행
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        // 쉼표나 줄바꿈이 포함된 경우 따옴표로 감싸기
        if (typeof value === 'string' && (value.includes(',') || value.includes('\n'))) {
          return `"${value}"`;
        }
        return value;
      }).join(',')
    ),
  ].join('\n');

  // BOM 추가 (엑셀에서 한글 깨짐 방지)
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

  // 다운로드 링크 생성
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * PDF 리포트 생성 (기본)
 * 실제로는 PDF 라이브러리(jspdf 등)를 사용해야 하지만,
 * 여기서는 HTML을 프린트하는 방식으로 간단히 구현
 */
export function exportToPDF(title: string, content: string) {
  // 새 창에서 프린트 다이얼로그 열기
  const printWindow = window.open('', '_blank');

  if (!printWindow) {
    alert('팝업이 차단되었습니다. 팝업을 허용해주세요.');
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body {
          font-family: 'Malgun Gothic', sans-serif;
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }
        h1 {
          color: #4F46E5;
          border-bottom: 2px solid #4F46E5;
          padding-bottom: 10px;
        }
        .info {
          color: #666;
          margin: 10px 0 30px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 12px;
          text-align: left;
        }
        th {
          background-color: #4F46E5;
          color: white;
        }
        tr:nth-child(even) {
          background-color: #f9fafb;
        }
        @media print {
          body {
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <div class="info">
        생성일시: ${new Date().toLocaleString('ko-KR')}
      </div>
      ${content}
      <script>
        window.onload = function() {
          window.print();
          window.onafterprint = function() {
            window.close();
          };
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

/**
 * 통계 데이터를 PDF용 HTML로 변환
 */
export function convertStatsToPDFContent(data: any[]): string {
  if (data.length === 0) {
    return '<p>데이터가 없습니다.</p>';
  }

  const headers = Object.keys(data[0]);

  return `
    <table>
      <thead>
        <tr>
          ${headers.map(header => `<th>${header}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${data.map(row => `
          <tr>
            ${headers.map(header => `<td>${row[header]}</td>`).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}
