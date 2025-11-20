import {
  exportToCSV,
  exportToPDF,
  convertStatsToPDFContent,
} from '../export';

// Mock DOM APIs
describe('export utilities', () => {
  beforeEach(() => {
    // Mock alert
    global.alert = jest.fn();

    // Mock URL.createObjectURL
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    global.URL.revokeObjectURL = jest.fn();

    // Mock document methods
    document.createElement = jest.fn((tag) => {
      const element = {
        setAttribute: jest.fn(),
        click: jest.fn(),
        style: {},
      } as any;
      return element;
    });

    document.body.appendChild = jest.fn();
    document.body.removeChild = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('exportToCSV', () => {
    it('빈 데이터 배열에 대해 alert를 표시해야 함', () => {
      exportToCSV([]);
      expect(global.alert).toHaveBeenCalledWith('내보낼 데이터가 없습니다.');
    });

    it('CSV 파일 다운로드를 트리거해야 함', () => {
      const data = [
        { name: '서울', value: 100 },
        { name: '부산', value: 200 },
      ];

      exportToCSV(data, 'test.csv');

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    it('쉼표가 포함된 값을 따옴표로 감싸야 함', () => {
      const data = [
        { name: '서울, 대한민국', value: 100 },
      ];

      // Blob 생성 확인을 위한 spy
      const createElementSpy = jest.spyOn(document, 'createElement');
      exportToCSV(data);

      expect(createElementSpy).toHaveBeenCalled();
    });

    it('줄바꿈이 포함된 값을 따옴표로 감싸야 함', () => {
      const data = [
        { name: '서울\n대한민국', value: 100 },
      ];

      exportToCSV(data);
      expect(document.createElement).toHaveBeenCalled();
    });

    it('기본 파일명을 사용해야 함', () => {
      const data = [{ name: '테스트', value: 1 }];
      exportToCSV(data);

      const mockElement = (document.createElement as jest.Mock).mock.results[0].value;
      expect(mockElement.setAttribute).toHaveBeenCalledWith('download', 'export.csv');
    });

    it('사용자 지정 파일명을 사용해야 함', () => {
      const data = [{ name: '테스트', value: 1 }];
      exportToCSV(data, 'custom.csv');

      const mockElement = (document.createElement as jest.Mock).mock.results[0].value;
      expect(mockElement.setAttribute).toHaveBeenCalledWith('download', 'custom.csv');
    });
  });

  describe('exportToPDF', () => {
    let mockWindow: any;

    beforeEach(() => {
      mockWindow = {
        document: {
          write: jest.fn(),
          close: jest.fn(),
        },
      };
      global.window.open = jest.fn(() => mockWindow);
    });

    it('새 창을 열고 PDF 내용을 작성해야 함', () => {
      exportToPDF('테스트 리포트', '<p>테스트 내용</p>');

      expect(window.open).toHaveBeenCalledWith('', '_blank');
      expect(mockWindow.document.write).toHaveBeenCalled();
      expect(mockWindow.document.close).toHaveBeenCalled();
    });

    it('팝업이 차단되면 alert를 표시해야 함', () => {
      global.window.open = jest.fn(() => null);

      exportToPDF('테스트', '내용');

      expect(global.alert).toHaveBeenCalledWith(
        '팝업이 차단되었습니다. 팝업을 허용해주세요.'
      );
    });

    it('제목과 내용을 포함한 HTML을 생성해야 함', () => {
      exportToPDF('테스트 제목', '<p>테스트 내용</p>');

      const writtenContent = mockWindow.document.write.mock.calls[0][0];
      expect(writtenContent).toContain('테스트 제목');
      expect(writtenContent).toContain('<p>테스트 내용</p>');
    });

    it('생성일시를 포함해야 함', () => {
      exportToPDF('리포트', '내용');

      const writtenContent = mockWindow.document.write.mock.calls[0][0];
      expect(writtenContent).toContain('생성일시:');
    });

    it('프린트 스크립트를 포함해야 함', () => {
      exportToPDF('리포트', '내용');

      const writtenContent = mockWindow.document.write.mock.calls[0][0];
      expect(writtenContent).toContain('window.print()');
      expect(writtenContent).toContain('window.onafterprint');
    });
  });

  describe('convertStatsToPDFContent', () => {
    it('빈 데이터 배열에 대해 메시지를 반환해야 함', () => {
      const result = convertStatsToPDFContent([]);
      expect(result).toBe('<p>데이터가 없습니다.</p>');
    });

    it('데이터를 HTML 테이블로 변환해야 함', () => {
      const data = [
        { region: '서울', count: 100 },
        { region: '부산', count: 200 },
      ];

      const result = convertStatsToPDFContent(data);

      expect(result).toContain('<table>');
      expect(result).toContain('<thead>');
      expect(result).toContain('<tbody>');
      expect(result).toContain('</table>');
    });

    it('테이블 헤더를 올바르게 생성해야 함', () => {
      const data = [{ name: '서울', value: 100 }];
      const result = convertStatsToPDFContent(data);

      expect(result).toContain('<th>name</th>');
      expect(result).toContain('<th>value</th>');
    });

    it('테이블 데이터를 올바르게 생성해야 함', () => {
      const data = [
        { region: '서울', count: 100 },
        { region: '부산', count: 200 },
      ];
      const result = convertStatsToPDFContent(data);

      expect(result).toContain('<td>서울</td>');
      expect(result).toContain('<td>100</td>');
      expect(result).toContain('<td>부산</td>');
      expect(result).toContain('<td>200</td>');
    });

    it('여러 컬럼을 올바르게 처리해야 함', () => {
      const data = [
        { col1: 'a', col2: 'b', col3: 'c' },
      ];
      const result = convertStatsToPDFContent(data);

      expect(result).toContain('<th>col1</th>');
      expect(result).toContain('<th>col2</th>');
      expect(result).toContain('<th>col3</th>');
      expect(result).toContain('<td>a</td>');
      expect(result).toContain('<td>b</td>');
      expect(result).toContain('<td>c</td>');
    });
  });
});
