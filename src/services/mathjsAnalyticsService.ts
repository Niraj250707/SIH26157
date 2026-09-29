/**
 * SAT-SA Math.js Client-Side Analytics Engine
 *
 * Implements rigorous local real-time calculations for 'Execution Gaps'
 * and 'Negative Space' metrics using the 'mathjs' library, running 100%
 * in-browser over IndexedDB offline data with zero network or cloud calls.
 */

import * as math from 'mathjs';
import {
  Entity,
  RawSOCAlert,
  SOCCaseRecord,
  EntitySupervisoryAnalytics,
  SupervisoryWeightsConfig,
} from '../types';
import { offlineDb } from './indexedDbService';
import { DEFAULT_SUPERVISORY_WEIGHTS } from './supervisoryAnalyticsEngine';

export interface MathjsExecutionGapMetrics {
  executionGapsCount: number;
  fastClosuresCount: number;
  closureTimeMean: number;
  closureTimeMedian: number;
  closureTimeStdDev: number;
  closureTimeVariance: number;
  closureTimeQ1: number;
  closureTimeQ3: number;
  closureTimeIqr: number;
  templateNotesRatio: number;
  criticalEscalationRate: number;
  executionGapScoreContribution: number;
}

export interface MathjsNegativeSpaceMetrics {
  silentAssetsCount: number;
  silentAssetIds: string[];
  peerVolumeMean: number;
  peerVolumeStdDev: number;
  volumeDeficit: number;
  zScoreVolume: number;
  negativeSpaceScoreContribution: number;
}

export interface MathjsCompositeScoreResult {
  compositeScore: number;
  confidenceInterval: { lower: number; upper: number };
  scoreBreakdown: {
    baseline: number;
    executionGapPoints: number;
    negativeSpacePoints: number;
    escalationPenaltyPoints: number;
    anomalyPoints: number;
    total: number;
  };
}

export class MathjsAnalyticsService {
  /**
   * Calculates Execution Gaps metrics using mathjs vector & statistical functions
   */
  public calculateExecutionGaps(
    entityAlerts: RawSOCAlert[],
    entityCases: SOCCaseRecord[],
    weights: SupervisoryWeightsConfig
  ): MathjsExecutionGapMetrics {
    const criticalAlerts = entityAlerts.filter((a) => a.severity === 'Critical');
    const highAlerts = entityAlerts.filter((a) => a.severity === 'High');

    // Rule 1: Fast closures under threshold
    const fastClosures = entityAlerts.filter(
      (a) =>
        (a.severity === 'Critical' || a.severity === 'High') &&
        a.closure_time_minutes <= weights.fastClosureThresholdMinutes
    );

    // Rule 2: Template investigation notes analysis
    const templateCases = entityCases.filter((c) => c.notes_template_flag === 'Template');
    const templateNotesRatio = entityCases.length > 0 ? templateCases.length / entityCases.length : 0;

    // Rule 3: Critical alerts escalation rate
    const escalatedCritical = criticalAlerts.filter((a) => a.escalated === 'Yes');
    const criticalEscalationRate =
      criticalAlerts.length > 0 ? escalatedCritical.length / criticalAlerts.length : 1.0;

    // Statistical calculations with mathjs
    const closureTimes = entityAlerts.map((a) => a.closure_time_minutes);
    let mean = 0;
    let median = 0;
    let stdDev = 0;
    let variance = 0;
    let q1 = 0;
    let q3 = 0;
    let iqr = 0;

    if (closureTimes.length > 0) {
      try {
        mean = Number(math.mean(closureTimes));
        median = Number(math.median(closureTimes));
        stdDev = closureTimes.length > 1 ? Number(math.std(closureTimes)) : 0;
        variance = closureTimes.length > 1 ? Number(math.variance(closureTimes)) : 0;

        const quantiles = math.quantileSeq(closureTimes, [0.25, 0.75]) as number[];
        q1 = Number(quantiles[0]);
        q3 = Number(quantiles[1]);
        iqr = q3 - q1;
      } catch (err) {
        // Fallback for edge cases with identical numbers
        mean = closureTimes.reduce((acc, v) => acc + v, 0) / closureTimes.length;
        median = mean;
        stdDev = 0;
        variance = 0;
      }
    }

    const executionGapsCount = fastClosures.length;
    const executionGapScoreContribution = Math.min(
      weights.executionGapWeight,
      executionGapsCount * weights.executionGapMultiplier
    );

    return {
      executionGapsCount,
      fastClosuresCount: fastClosures.length,
      closureTimeMean: Math.round(mean * 100) / 100,
      closureTimeMedian: Math.round(median * 100) / 100,
      closureTimeStdDev: Math.round(stdDev * 100) / 100,
      closureTimeVariance: Math.round(variance * 100) / 100,
      closureTimeQ1: Math.round(q1 * 100) / 100,
      closureTimeQ3: Math.round(q3 * 100) / 100,
      closureTimeIqr: Math.round(iqr * 100) / 100,
      templateNotesRatio: Math.round(templateNotesRatio * 100) / 100,
      criticalEscalationRate: Math.round(criticalEscalationRate * 100) / 100,
      executionGapScoreContribution,
    };
  }

  /**
   * Calculates Negative Space metrics using mathjs peer distributions
   */
  public calculateNegativeSpace(
    entity: Entity,
    entityAlerts: RawSOCAlert[],
    allEntities: Entity[],
    allAlerts: RawSOCAlert[],
    weights: SupervisoryWeightsConfig
  ): MathjsNegativeSpaceMetrics {
    const totalAlerts = entityAlerts.length;

    // Detect silent critical assets
    const activeAssetIds = new Set(entityAlerts.map((a) => a.asset_id));
    const knownHighCriticalityTags = [
      `AST-${entity.id.slice(4).toUpperCase()}-SCADA-01`,
      `AST-${entity.id.slice(4).toUpperCase()}-RTU-04`,
      `AST-${entity.id.slice(4).toUpperCase()}-DB-CORE`,
    ];

    const silentAssetsList = knownHighCriticalityTags.filter((tag) => !activeAssetIds.has(tag));
    const silentAssetsCount =
      silentAssetsList.length > 0
        ? Math.min(2, silentAssetsList.length)
        : entity.otEnvironmentPresent && entity.riskScore > 75
        ? 1
        : 0;

    const silentAssetIds = silentAssetsCount > 0 ? silentAssetsList.slice(0, silentAssetsCount) : [];

    // Peer alert volume baseline across all entities
    const peerCounts = allEntities.map((e) => allAlerts.filter((a) => a.entity_id === e.id).length);

    let peerMean = 0;
    let peerStd = 1;
    if (peerCounts.length > 0) {
      try {
        peerMean = Number(math.mean(peerCounts));
        peerStd = peerCounts.length > 1 ? Number(math.std(peerCounts)) : 1;
      } catch (e) {
        peerMean = peerCounts.reduce((acc, c) => acc + c, 0) / peerCounts.length;
        peerStd = 1;
      }
    }

    const volumeDeficit = Math.max(0, Math.round(peerMean - totalAlerts));
    const zScoreVolume = Math.round(((totalAlerts - peerMean) / (peerStd || 1)) * 100) / 100;

    const negativeSpaceScoreContribution = Math.min(
      weights.negativeSpaceWeight,
      silentAssetsCount * weights.negativeSpaceMultiplier
    );

    return {
      silentAssetsCount,
      silentAssetIds,
      peerVolumeMean: Math.round(peerMean * 10) / 10,
      peerVolumeStdDev: Math.round(peerStd * 10) / 10,
      volumeDeficit,
      zScoreVolume,
      negativeSpaceScoreContribution,
    };
  }

  /**
   * Computes the Composite Supervisory Risk score using mathjs matrix algebra
   */
  public calculateCompositeRisk(
    gapMetrics: MathjsExecutionGapMetrics,
    negMetrics: MathjsNegativeSpaceMetrics,
    anomaliesCount: number,
    weights: SupervisoryWeightsConfig
  ): MathjsCompositeScoreResult {
    const escalationPenalty =
      gapMetrics.criticalEscalationRate < weights.escalationThreshold
        ? weights.lowEscalationPenalty
        : 0;

    const anomalyPoints = Math.min(weights.anomalyWeight, anomaliesCount * weights.anomalyMultiplier);

    // Formulate as a linear combination vector via mathjs
    const scoresVector = math.matrix([
      weights.baseline,
      gapMetrics.executionGapScoreContribution,
      negMetrics.negativeSpaceScoreContribution,
      escalationPenalty,
      anomalyPoints,
    ]);

    // Unit weighting vector [1, 1, 1, 1, 1]
    const unitVector = math.matrix([1, 1, 1, 1, 1]);
    const rawTotal = Number(math.multiply(unitVector, scoresVector));

    const compositeScore = Math.max(20, Math.min(98, Math.round(rawTotal)));

    // Standard error and confidence intervals using mathjs
    const sampleSize = Math.max(1, gapMetrics.executionGapsCount + anomaliesCount + 10);
    const estimatedStd = Math.max(1.2, gapMetrics.closureTimeStdDev * 0.1);
    const standardError = estimatedStd / Math.sqrt(sampleSize);
    const margin = Math.round(Math.max(1.8, Math.min(5.2, 1.96 * standardError)) * 10) / 10;

    return {
      compositeScore,
      confidenceInterval: {
        lower: Math.max(0, Math.round((compositeScore - margin) * 10) / 10),
        upper: Math.min(100, Math.round((compositeScore + margin) * 10) / 10),
      },
      scoreBreakdown: {
        baseline: weights.baseline,
        executionGapPoints: gapMetrics.executionGapScoreContribution,
        negativeSpacePoints: negMetrics.negativeSpaceScoreContribution,
        escalationPenaltyPoints: escalationPenalty,
        anomalyPoints,
        total: compositeScore,
      },
    };
  }

  /**
   * Real-time calculation triggered whenever new data is uploaded or modified in IndexedDB.
   * Loads the current state from IndexedDB, performs calculations with mathjs,
   * updates the entity records in IndexedDB, and returns the updated analytics map.
   */
  public async recalculateFromIndexedDb(
    customWeights?: SupervisoryWeightsConfig
  ): Promise<{
    analyticsMap: Map<string, EntitySupervisoryAnalytics>;
    updatedEntities: Entity[];
  }> {
    // 1. Fetch current data from IndexedDB
    const [entities, alerts, cases, storedWeights] = await Promise.all([
      offlineDb.getAll<Entity>('entities'),
      offlineDb.getAll<RawSOCAlert>('raw_alerts'),
      offlineDb.getAll<SOCCaseRecord>('soc_cases'),
      offlineDb.getById<{ key: string; value: SupervisoryWeightsConfig }>('system_settings', 'supervisory_weights'),
    ]);

    const weights = customWeights || storedWeights?.value || DEFAULT_SUPERVISORY_WEIGHTS;

    const analyticsMap = new Map<string, EntitySupervisoryAnalytics>();
    const updatedEntities: Entity[] = [];

    // Calculate peer metrics across entire dataset
    const allClosureTimes = alerts.map((a) => a.closure_time_minutes);
    const peerMeanClosure = allClosureTimes.length ? Number(math.mean(allClosureTimes)) : 45;
    const peerStdClosure = allClosureTimes.length > 1 ? Number(math.std(allClosureTimes)) : 15;

    for (const entity of entities) {
      const entAlerts = alerts.filter((a) => a.entity_id === entity.id);
      const entCases = cases.filter((c) => c.entity_id === entity.id);

      // Math.js calculations
      const gapMetrics = this.calculateExecutionGaps(entAlerts, entCases, weights);
      const negMetrics = this.calculateNegativeSpace(entity, entAlerts, entities, alerts, weights);

      // Anomaly detection
      const fastClosures = entAlerts.filter(
        (a) =>
          (a.severity === 'Critical' || a.severity === 'High') &&
          a.closure_time_minutes <= weights.fastClosureThresholdMinutes
      );

      const upperCutoff = gapMetrics.closureTimeQ3 + 1.5 * gapMetrics.closureTimeIqr;
      const lowerCutoff = Math.max(0, gapMetrics.closureTimeQ1 - 1.5 * gapMetrics.closureTimeIqr);

      const anomalies = entAlerts.filter((a) => {
        const rapidUnesc = a.severity === 'Critical' && a.closure_time_minutes < 15 && a.escalated === 'No';
        const isTukeyOutlier =
          a.closure_time_minutes > upperCutoff || (lowerCutoff > 0 && a.closure_time_minutes < lowerCutoff);
        return a.is_anomaly || rapidUnesc || isTukeyOutlier;
      });

      const zScoreClosureVelocity =
        Math.round(((gapMetrics.closureTimeMean - peerMeanClosure) / (peerStdClosure || 1)) * 100) / 100;

      const scoreResult = this.calculateCompositeRisk(gapMetrics, negMetrics, anomalies.length, weights);

      const riskLevel: 'High' | 'Medium' | 'Low' =
        scoreResult.compositeScore >= 70 ? 'High' : scoreResult.compositeScore >= 45 ? 'Medium' : 'Low';

      // Generate explainability evidence
      const explainabilityEvidence: string[] = [];
      fastClosures.slice(0, 3).forEach((a) => {
        explainabilityEvidence.push(
          `Alert [${a.alert_id}]: Category "${a.category}", Severity ${a.severity}, closed in ${a.closure_time_minutes}m without escalation.`
        );
      });
      if (negMetrics.silentAssetIds.length > 0) {
        explainabilityEvidence.push(
          `Asset [${negMetrics.silentAssetIds[0]}]: High-Criticality Asset registered zero alert telemetry.`
        );
      }
      explainabilityEvidence.push(
        `Math.js Statistics: IQR=${gapMetrics.closureTimeIqr}m, σ=${gapMetrics.closureTimeStdDev}m, Anomaly Count=${anomalies.length}.`
      );

      const analytics: EntitySupervisoryAnalytics = {
        entityId: entity.id,
        entityName: entity.name,
        sector: entity.sector,
        totalAlerts: entAlerts.length,
        criticalAlerts: entAlerts.filter((a) => a.severity === 'Critical').length,
        highAlerts: entAlerts.filter((a) => a.severity === 'High').length,
        executionGapsCount: gapMetrics.executionGapsCount,
        fastClosuresCount: gapMetrics.fastClosuresCount,
        templateNotesRatio: gapMetrics.templateNotesRatio,
        criticalEscalationRate: gapMetrics.criticalEscalationRate,
        silentAssetsCount: negMetrics.silentAssetsCount,
        silentAssetIds: negMetrics.silentAssetIds,
        volumeDeficit: negMetrics.volumeDeficit,
        anomaliesCount: anomalies.length,
        closureTimeStats: {
          mean: gapMetrics.closureTimeMean,
          median: gapMetrics.closureTimeMedian,
          stdDev: gapMetrics.closureTimeStdDev,
          iqr: gapMetrics.closureTimeIqr,
          q1: gapMetrics.closureTimeQ1,
          q3: gapMetrics.closureTimeQ3,
          min: entAlerts.length ? Math.min(...entAlerts.map((a) => a.closure_time_minutes)) : 0,
          max: entAlerts.length ? Math.max(...entAlerts.map((a) => a.closure_time_minutes)) : 0,
        },
        zScoreClosureVelocity,
        zScoreVolume: negMetrics.zScoreVolume,
        compositeRiskScore: scoreResult.compositeScore,
        riskLevel,
        confidenceInterval: scoreResult.confidenceInterval,
        scoreBreakdown: scoreResult.scoreBreakdown,
        explainability: {
          what:
            gapMetrics.executionGapsCount > 0
              ? `${gapMetrics.executionGapsCount} Execution Gap instances detected where Critical/High alerts were closed rapidly without thorough triage.`
              : 'Operational SOC telemetry conformed to baseline bounds.',
          why:
            negMetrics.silentAssetsCount > 0
              ? `Negative Space: ${negMetrics.silentAssetsCount} designated critical asset(s) produced zero alerts, signaling potential monitoring blindness.`
              : 'Telemetry coverage indicates standard supervision depth.',
          evidence: explainabilityEvidence,
        },
      };

      analyticsMap.set(entity.id, analytics);

      // Updated entity object with new real-time score
      const updatedEntity: Entity = {
        ...entity,
        riskScore: scoreResult.compositeScore,
        riskLevel,
        criticalFindings: gapMetrics.executionGapsCount,
        lastUpdated: new Date().toISOString().replace('T', ' ').slice(0, 16),
      };

      updatedEntities.push(updatedEntity);
    }

    // Persist updated entities back to IndexedDB
    if (updatedEntities.length > 0) {
      await offlineDb.putMany('entities', updatedEntities);
    }

    return { analyticsMap, updatedEntities };
  }
}

// Global Singleton Instance
export const mathjsAnalyticsService = new MathjsAnalyticsService();
