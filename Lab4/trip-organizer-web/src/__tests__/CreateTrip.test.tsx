import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { CreateTrip } from '../pages/CreateTrip';

describe('CreateTrip', () => {
  test('renders create trip form', () => {
    render(
      <BrowserRouter>
        <CreateTrip />
      </BrowserRouter>
    );
    expect(screen.getByText(/create new trip/i)).toBeInTheDocument();
  });
});
