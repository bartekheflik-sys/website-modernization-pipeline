import { z } from 'zod';

export const PipelineStateSchema = z.enum([
  'pending',
  'crawling',
  'assets_processing',
  'analysis_running',
  'analysis_completed',
  'prompt_generating',
  'prompt_completed',
  'lovable_generating',
  'lovable_completed',
  'qa_running',
  'qa_completed',
  'repair_required',
  'repair_generating',
  'repair_completed',
  'completed',
  'failed'
]);

export type PipelineState = z.infer<typeof PipelineStateSchema>;

export const TERMINAL_STATES: PipelineState[] = ['completed', 'failed'];

// Define valid transitions: Record<CurrentState, ValidNextStates[]>
export const VALID_TRANSITIONS: Record<PipelineState, PipelineState[]> = {
  pending: ['crawling', 'failed'],
  crawling: ['assets_processing', 'failed'],
  assets_processing: ['analysis_running', 'failed'],
  analysis_running: ['analysis_completed', 'failed'],
  analysis_completed: ['prompt_generating', 'failed'],
  prompt_generating: ['prompt_completed', 'failed'],
  prompt_completed: ['lovable_generating', 'completed', 'failed'], // can complete here if no lovable integration
  lovable_generating: ['lovable_completed', 'failed'],
  lovable_completed: ['qa_running', 'completed', 'failed'],
  qa_running: ['qa_completed', 'failed'],
  qa_completed: ['repair_required', 'completed', 'failed'],
  repair_required: ['repair_generating', 'failed'],
  repair_generating: ['repair_completed', 'failed'],
  repair_completed: ['qa_running', 'completed', 'failed'], // Loop back to QA or finish
  completed: [], // Terminal
  failed: ['pending', 'crawling', 'analysis_running', 'prompt_generating', 'qa_running', 'repair_generating'] // Allowed retries
};

export interface StateTransitionRequest {
  projectId: string;
  currentState: PipelineState;
  targetState: PipelineState;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface StateTransitionResult {
  success: boolean;
  newState?: PipelineState;
  error?: string;
}

export class PipelineStateMachine {
  /**
   * Validates if a transition from currentState to targetState is mathematically allowed.
   */
  static canTransition(currentState: PipelineState, targetState: PipelineState): boolean {
    if (currentState === targetState) return true; // Idempotent transition
    
    const allowedTargets = VALID_TRANSITIONS[currentState] || [];
    return allowedTargets.includes(targetState);
  }

  /**
   * Centralized logic to attempt a state transition.
   * In a full implementation, this interacts with the database.
   */
  static validateTransition(currentState: PipelineState, targetState: PipelineState): void {
    if (!this.canTransition(currentState, targetState)) {
      throw new Error(`[State Machine] Invalid transition: Cannot move from '${currentState}' to '${targetState}'.`);
    }
  }

  /**
   * Determines if a state is terminal.
   */
  static isTerminal(state: PipelineState): boolean {
    return TERMINAL_STATES.includes(state);
  }
}
