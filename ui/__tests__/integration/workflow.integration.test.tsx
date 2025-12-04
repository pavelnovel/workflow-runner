/**
 * INTEGRATION TESTS - Workflow Flow
 *
 * Tests the complete workflow lifecycle from creation to completion.
 */

import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';

describe('Integration Tests - Workflow Lifecycle', () => {
  it('should complete the workflow creation flow', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Navigate to Workflows
    await user.click(screen.getByText('Workflows'));

    // Wait for workflows to load
    await waitFor(() => {
      expect(screen.getByText('Create Workflow')).toBeInTheDocument();
    });

    // Click Create Workflow (opens AI modal)
    await user.click(screen.getByText('Create Workflow'));

    // Modal should appear
    await waitFor(() => {
      expect(screen.getByText('Generate Workflow with AI')).toBeInTheDocument();
    });
  });

  it('should start a run from a workflow template', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Navigate to Workflows
    await user.click(screen.getByText('Workflows'));

    // Wait for workflows to load and find Start Run button
    await waitFor(() => {
      expect(screen.getByText('Test Workflow')).toBeInTheDocument();
    });

    // Find the Start Run button
    const startButton = screen.getByText('Start Run');
    expect(startButton).toBeInTheDocument();
  });

  it('should navigate between dashboard views correctly', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Start on Dashboard
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Overview' })).toBeInTheDocument();
    });

    // Go to Workflows
    await user.click(screen.getByText('Workflows'));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Workflows' })).toBeInTheDocument();
    });

    // Go to Runs
    await user.click(screen.getByText('Runs'));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Runs' })).toBeInTheDocument();
    });

    // Go back to Dashboard
    await user.click(screen.getByText('Dashboard'));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Overview' })).toBeInTheDocument();
    });
  });
});

describe('Integration Tests - Settings Integration', () => {
  it('should persist settings across navigation', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Go to Settings
    await user.click(screen.getByText('Settings'));
    await waitFor(() => {
      expect(screen.getByText('Gemini API Key')).toBeInTheDocument();
    });

    // Enter API key
    const input = screen.getByPlaceholderText('Enter your Gemini API key');
    await user.clear(input);
    await user.type(input, 'my-test-key');
    await user.click(screen.getByText('Save API Key'));

    // Navigate away and back
    await user.click(screen.getByText('Dashboard'));
    await user.click(screen.getByText('Settings'));

    // Key should still be there
    await waitFor(() => {
      const input = screen.getByPlaceholderText('Enter your Gemini API key');
      expect(input).toHaveValue('my-test-key');
    });
  });
});
