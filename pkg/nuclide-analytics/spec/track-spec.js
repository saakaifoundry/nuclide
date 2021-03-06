'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import main from '..';
import * as track from '../lib/track';
import invariant from 'assert';

const startTracking = main.startTracking;

describe('startTracking', () => {
  let trackKey;
  let trackValues;
  let originalProcessHrTime = null;
  let originalWindowPerformance = null;

  beforeEach(() => {
    // `advanceClock` relies on Date.now exclusively. Ensure fallback to Date.now in tests.
    originalProcessHrTime = (process: any).hrtime;
    (process: any).hrtime = null;
    if (window && window.performance) {
      originalWindowPerformance = window.performance;
      window.performance = null;
    }

    // Clear intercepted tracking data.
    trackKey = null;
    trackValues = null;

    spyOn(track, 'track').andCallFake((key, values) => {
      trackKey = key;
      trackValues = values;
      return Promise.resolve();
    });

  });

  afterEach(() => {
    (process: any).hrtime = originalProcessHrTime;
    if (originalWindowPerformance) {
      window.performance = originalWindowPerformance;
    }
    // Reset for subsequent tests.
    originalProcessHrTime = null;
    originalWindowPerformance = null;
  });

  it('startTracking - success', () => {
    const timer = startTracking('st-success');
    advanceClock(10);
    timer.onSuccess();
    expect(track.track).toHaveBeenCalled();
    expect(trackKey).toBe('performance');
    invariant(trackValues != null);
    expect(trackValues.duration).toBe('10');
    expect(trackValues.eventName).toBe('st-success');
    expect(trackValues.error).toBe('0');
    expect(trackValues.exception).toBe('');
  });

  it('startTracking - error', () => {
    const timer = startTracking('st-error');
    advanceClock(11);
    timer.onError(new Error());
    expect(track.track).toHaveBeenCalled();
    expect(trackKey).toBe('performance');
    invariant(trackValues != null);
    expect(trackValues.duration).toBe('11');
    expect(trackValues.eventName).toBe('st-error');
    expect(trackValues.error).toBe('1');
    expect(trackValues.exception).toBe('Error');
  });
});

describe('trackImmediate', () => {
  let spy;
  beforeEach(() => {
    spy = spyOn(track, 'track').andCallFake((key, values) => {
      return Promise.resolve(1);
    });
  });

  it('should call track with immediate = true', () => {
    waitsForPromise(async () => {
      const result = await main.trackImmediate('test', {});
      expect(result).toBe(1);
      expect(spy).toHaveBeenCalledWith('test', {}, true);
    });
  });
});
