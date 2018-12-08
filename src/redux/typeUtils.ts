
import { Action } from 'redux'

interface ActionWithData<T extends string, D> extends Action<T> {
  data: D;
}

type FunctionType = (...args: any[]) => any;
export type ActionCreatorsMap = { [actionCreator: string]: FunctionType };
export type ActionsUnion<A extends ActionCreatorsMap> = ReturnType<A[keyof A]>;

type MapReturnToVoid<T> =
  T extends (...args: infer U) => any ? (...args: U) => void : T;

export type DispatchPropsFromActions<T> = {
   [P in keyof T]: MapReturnToVoid<T[P]>;
}

export function createAction<T extends string>(type: T): Action<T>
export function createAction<T extends string, D>(type: T, data: D): ActionWithData<T, D>
export function createAction<T extends string, D>(type: T, data?: D) {
  return data === undefined ? { type } : { type, data };
}

export function updateField<State, K extends keyof State>(
  state:  State,
  field:  K,
  value:  State[K]
): State {
  return {
    ...state,
    [field]: value
  }
}
