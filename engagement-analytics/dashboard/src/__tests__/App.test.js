import { render, screen } from '@testing-library/react';
import App from '../App';

test('renders attendance table', () => {
  render(<App />);
  const tableElement = screen.getByTestId('attendance-table');
  expect(tableElement).toBeInTheDocument();
});