/**
 * SUITE DE TESTS MAÎTRE - API ROOMS
 * 
 * Orchestrateur principal pour exécuter tous les tests CRUD
 * et générer un rapport complet de validation.
 * 
 * OBJECTIFS :
 * - Exécuter tous les types de tests dans l'ordre approprié
 * - Générer un rapport détaillé de validation
 * - Fournir des métriques de qualité et de fiabilité
 * - Valider la conformité de l'API aux exigences
 */

const { TestRunner } = require('./rooms-crud-comprehensive.test.js');
const { ErrorTestRunner } = require('./rooms-error-handling.test.js');
const { TypeScriptTestRunner } = require('./rooms-typescript-validation.test.js');
const { PerformanceTestRunner } = require('./rooms-performance.test.js');
const { DataConsistencyTestRunner } = require('./rooms-data-consistency.test.js');

class MasterTestSuite {
  static async runAllTests() {
    console.log('\n🚀 SUITE DE TESTS EXHAUSTIVE - API ROOMS CRUD');
    console.log('===============================================');
    console.log('Démarrage de la validation complète de l\'API de gestion des chambres');
    console.log(`Date: ${new Date().toISOString()}`);
    console.log('===============================================\n');

    const masterStartTime = Date.now();
    const testResults = {
      crud: null,
      errorHandling: null,
      typeScript: null,
      performance: null,
      dataConsistency: null,
      masterSummary: {
        totalTests: 0,
        totalPassed: 0,
        totalFailed: 0,
        totalDuration: 0,
        overallSuccessRate: 0,
        qualityMetrics: {},
        recommendations: [],
        criticalIssues: [],
        warnings: []
      }
    };

    try {
      // 1. TESTS CRUD COMPLETS
      console.log('🔄 Phase 1/5: Tests CRUD Complets');
      console.log('==================================');
      testResults.crud = await TestRunner.runAllTests();
      this.logPhaseCompletion('CRUD', testResults.crud);

      // 2. TESTS DE GESTION D'ERREURS
      console.log('\n🛡️ Phase 2/5: Tests de Gestion d\'Erreurs');
      console.log('=========================================');
      testResults.errorHandling = await ErrorTestRunner.runAllErrorTests();
      this.logPhaseCompletion('Gestion d\'Erreurs', testResults.errorHandling);

      // 3. TESTS TYPESCRIPT
      console.log('\n🔧 Phase 3/5: Tests TypeScript et Validation des Types');
      console.log('======================================================');
      testResults.typeScript = await TypeScriptTestRunner.runAllTypeScriptTests();
      this.logPhaseCompletion('TypeScript', testResults.typeScript);

      // 4. TESTS DE PERFORMANCE
      console.log('\n⚡ Phase 4/5: Tests de Performance');
      console.log('==================================');
      testResults.performance = await PerformanceTestRunner.runAllPerformanceTests();
      this.logPhaseCompletion('Performance', testResults.performance);

      // 5. TESTS DE COHÉRENCE DES DONNÉES
      console.log('\n🔗 Phase 5/5: Tests de Cohérence des Données');
      console.log('=============================================');
      testResults.dataConsistency = await DataConsistencyTestRunner.runAllConsistencyTests();
      this.logPhaseCompletion('Cohérence des Données', testResults.dataConsistency);

      // CALCUL DU RÉSUMÉ MAÎTRE
      const masterEndTime = Date.now();
      testResults.masterSummary = this.calculateMasterSummary(testResults, masterStartTime, masterEndTime);

    } catch (error) {
      console.error(`🚨 ERREUR FATALE DANS LA SUITE DE TESTS: ${error.message}`);
      testResults.masterSummary.fatalError = error.message;
    }

    // GÉNÉRATION DU RAPPORT FINAL
    this.generateFinalReport(testResults);
    
    return testResults;
  }

  static logPhaseCompletion(phaseName, phaseResults) {
    const passed = phaseResults.summary?.totalPassed || 0;
    const failed = phaseResults.summary?.totalFailed || 0;
    const total = passed + failed;
    const rate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';
    
    console.log(`✅ Phase ${phaseName} terminée: ${passed}/${total} tests réussis (${rate}%)`);
    
    if (failed > 0) {
      console.log(`⚠️  ${failed} tests échoués dans la phase ${phaseName}`);
    }
  }

  static calculateMasterSummary(testResults, startTime, endTime) {
    const summary = {
      totalTests: 0,
      totalPassed: 0,
      totalFailed: 0,
      totalDuration: endTime - startTime,
      phaseResults: {},
      qualityMetrics: {},
      recommendations: [],
      criticalIssues: [],
      warnings: []
    };

    // Agrégation des résultats de toutes les phases
    const phases = ['crud', 'errorHandling', 'typeScript', 'performance', 'dataConsistency'];
    
    phases.forEach(phase => {
      const result = testResults[phase];
      if (result && result.summary) {
        const passed = result.summary.totalPassed || 0;
        const failed = result.summary.totalFailed || 0;
        
        summary.totalPassed += passed;
        summary.totalFailed += failed;
        summary.totalTests += (passed + failed);
        
        summary.phaseResults[phase] = {
          passed: passed,
          failed: failed,
          total: passed + failed,
          successRate: (passed + failed) > 0 ? ((passed / (passed + failed)) * 100) : 0,
          duration: result.summary.duration || 0
        };

        // Collecte des problèmes critiques
        if (result.summary.fatalError) {
          summary.criticalIssues.push(`${phase}: ${result.summary.fatalError}`);
        }

        // Analyse spécifique par phase
        this.analyzePhaseResults(phase, result, summary);
      }
    });

    // Calcul du taux de réussite global
    summary.overallSuccessRate = summary.totalTests > 0 ? 
      ((summary.totalPassed / summary.totalTests) * 100) : 0;

    // Calcul des métriques de qualité
    summary.qualityMetrics = this.calculateQualityMetrics(summary, testResults);

    // Génération des recommandations
    summary.recommendations = this.generateRecommendations(summary, testResults);

    return summary;
  }

  static analyzePhaseResults(phase, result, summary) {
    switch (phase) {
      case 'crud':
        this.analyzeCrudResults(result, summary);
        break;
      case 'errorHandling':
        this.analyzeErrorHandlingResults(result, summary);
        break;
      case 'typeScript':
        this.analyzeTypeScriptResults(result, summary);
        break;
      case 'performance':
        this.analyzePerformanceResults(result, summary);
        break;
      case 'dataConsistency':
        this.analyzeConsistencyResults(result, summary);
        break;
    }
  }

  static analyzeCrudResults(result, summary) {
    const operations = ['create', 'read', 'update', 'delete'];
    operations.forEach(op => {
      if (result[op] && result[op].failed > 0) {
        summary.criticalIssues.push(`Opération CRUD ${op.toUpperCase()} défaillante`);
      }
    });

    const crudSuccessRate = summary.phaseResults.crud?.successRate || 0;
    if (crudSuccessRate < 95) {
      summary.criticalIssues.push(`Taux de réussite CRUD insuffisant: ${crudSuccessRate.toFixed(1)}%`);
    } else if (crudSuccessRate < 98) {
      summary.warnings.push(`Taux de réussite CRUD acceptable mais améliorable: ${crudSuccessRate.toFixed(1)}%`);
    }
  }

  static analyzeErrorHandlingResults(result, summary) {
    const errorSuccessRate = summary.phaseResults.errorHandling?.successRate || 0;
    if (errorSuccessRate < 90) {
      summary.criticalIssues.push(`Gestion d'erreurs insuffisante: ${errorSuccessRate.toFixed(1)}%`);
    } else if (errorSuccessRate < 95) {
      summary.warnings.push(`Gestion d'erreurs à améliorer: ${errorSuccessRate.toFixed(1)}%`);
    }

    // Vérifications spécifiques de sécurité
    if (result.create && result.create.failed > 2) {
      summary.warnings.push('Plusieurs tests de sécurité CREATE ont échoué');
    }
  }

  static analyzeTypeScriptResults(result, summary) {
    const tsSuccessRate = summary.phaseResults.typeScript?.successRate || 0;
    if (tsSuccessRate < 95) {
      summary.criticalIssues.push(`Conformité TypeScript insuffisante: ${tsSuccessRate.toFixed(1)}%`);
    } else if (tsSuccessRate < 98) {
      summary.warnings.push(`Conformité TypeScript à surveiller: ${tsSuccessRate.toFixed(1)}%`);
    }
  }

  static analyzePerformanceResults(result, summary) {
    const perfSuccessRate = summary.phaseResults.performance?.successRate || 0;
    if (perfSuccessRate < 85) {
      summary.criticalIssues.push(`Performances insuffisantes: ${perfSuccessRate.toFixed(1)}%`);
    } else if (perfSuccessRate < 92) {
      summary.warnings.push(`Performances à optimiser: ${perfSuccessRate.toFixed(1)}%`);
    }

    // Analyse des métriques de performance spécifiques
    if (result.summary && result.summary.performanceMetrics) {
      const metrics = result.summary.performanceMetrics;
      if (metrics.averageDuration > 1000) {
        summary.warnings.push(`Temps de réponse moyen élevé: ${metrics.averageDuration.toFixed(0)}ms`);
      }
      if (metrics.p95Duration > 2000) {
        summary.warnings.push(`P95 des temps de réponse élevé: ${metrics.p95Duration.toFixed(0)}ms`);
      }
    }
  }

  static analyzeConsistencyResults(result, summary) {
    const consistencySuccessRate = summary.phaseResults.dataConsistency?.successRate || 0;
    if (consistencySuccessRate < 95) {
      summary.criticalIssues.push(`Cohérence des données insuffisante: ${consistencySuccessRate.toFixed(1)}%`);
    } else if (consistencySuccessRate < 98) {
      summary.warnings.push(`Cohérence des données à surveiller: ${consistencySuccessRate.toFixed(1)}%`);
    }

    // Vérifications spécifiques de cohérence
    if (result.summary && result.summary.consistencyMetrics) {
      const metrics = result.summary.consistencyMetrics;
      if (!metrics.hotelConsistency) {
        summary.criticalIssues.push('Incohérence détectée dans les relations hôtel-chambres');
      }
    }
  }

  static calculateQualityMetrics(summary, testResults) {
    const metrics = {
      reliability: summary.overallSuccessRate,
      robustness: summary.phaseResults.errorHandling?.successRate || 0,
      typeCompliance: summary.phaseResults.typeScript?.successRate || 0,
      performance: summary.phaseResults.performance?.successRate || 0,
      dataIntegrity: summary.phaseResults.dataConsistency?.successRate || 0
    };

    // Calcul d'un score de qualité global
    const weights = {
      reliability: 0.25,
      robustness: 0.20,
      typeCompliance: 0.15,
      performance: 0.20,
      dataIntegrity: 0.20
    };

    metrics.overallQualityScore = Object.entries(weights).reduce((score, [metric, weight]) => {
      return score + (metrics[metric] * weight);
    }, 0);

    // Classification de la qualité
    if (metrics.overallQualityScore >= 95) {
      metrics.qualityLevel = 'EXCELLENTE';
    } else if (metrics.overallQualityScore >= 90) {
      metrics.qualityLevel = 'TRÈS BONNE';
    } else if (metrics.overallQualityScore >= 85) {
      metrics.qualityLevel = 'BONNE';
    } else if (metrics.overallQualityScore >= 75) {
      metrics.qualityLevel = 'ACCEPTABLE';
    } else {
      metrics.qualityLevel = 'INSUFFISANTE';
    }

    return metrics;
  }

  static generateRecommendations(summary, testResults) {
    const recommendations = [];

    // Recommandations basées sur le taux de réussite global
    if (summary.overallSuccessRate < 90) {
      recommendations.push('CRITIQUE: Améliorer la stabilité générale de l\'API avant la mise en production');
    } else if (summary.overallSuccessRate < 95) {
      recommendations.push('Améliorer la fiabilité générale de l\'API');
    }

    // Recommandations par phase
    if (summary.phaseResults.crud?.successRate < 95) {
      recommendations.push('Corriger les défaillances dans les opérations CRUD de base');
    }

    if (summary.phaseResults.errorHandling?.successRate < 90) {
      recommendations.push('Renforcer la gestion d\'erreurs et la sécurité');
    }

    if (summary.phaseResults.typeScript?.successRate < 95) {
      recommendations.push('Améliorer la conformité TypeScript et la validation des types');
    }

    if (summary.phaseResults.performance?.successRate < 85) {
      recommendations.push('Optimiser les performances de l\'API');
    }

    if (summary.phaseResults.dataConsistency?.successRate < 95) {
      recommendations.push('Améliorer les mécanismes de cohérence des données');
    }

    // Recommandations spécifiques
    if (summary.criticalIssues.length > 0) {
      recommendations.push('Traiter en priorité tous les problèmes critiques identifiés');
    }

    if (summary.warnings.length > 3) {
      recommendations.push('Examiner et traiter les avertissements multiples');
    }

    // Recommandations de performance
    if (testResults.performance?.summary?.performanceMetrics?.averageDuration > 800) {
      recommendations.push('Optimiser les temps de réponse de l\'API');
    }

    return recommendations;
  }

  static generateFinalReport(testResults) {
    console.log('\n📊 RAPPORT FINAL DE VALIDATION - API ROOMS');
    console.log('===========================================');

    const summary = testResults.masterSummary;

    // En-tête du rapport
    console.log(`\n📈 RÉSUMÉ EXÉCUTIF`);
    console.log(`Tests exécutés: ${summary.totalTests}`);
    console.log(`Tests réussis: ${summary.totalPassed}`);
    console.log(`Tests échoués: ${summary.totalFailed}`);
    console.log(`Taux de réussite global: ${summary.overallSuccessRate.toFixed(2)}%`);
    console.log(`Durée totale: ${(summary.totalDuration / 1000).toFixed(1)}s`);

    // Métriques de qualité
    console.log(`\n🏆 MÉTRIQUES DE QUALITÉ`);
    const metrics = summary.qualityMetrics;
    console.log(`Score de qualité global: ${metrics.overallQualityScore.toFixed(1)}/100`);
    console.log(`Niveau de qualité: ${metrics.qualityLevel}`);
    console.log(`Fiabilité: ${metrics.reliability.toFixed(1)}%`);
    console.log(`Robustesse: ${metrics.robustness.toFixed(1)}%`);
    console.log(`Conformité TypeScript: ${metrics.typeCompliance.toFixed(1)}%`);
    console.log(`Performance: ${metrics.performance.toFixed(1)}%`);
    console.log(`Intégrité des données: ${metrics.dataIntegrity.toFixed(1)}%`);

    // Résultats par phase
    console.log(`\n📋 RÉSULTATS PAR PHASE`);
    Object.entries(summary.phaseResults).forEach(([phase, result]) => {
      const phaseName = this.getPhaseName(phase);
      console.log(`${phaseName.padEnd(25)}: ${result.passed}/${result.total} (${result.successRate.toFixed(1)}%) - ${result.duration}ms`);
    });

    // Problèmes critiques
    if (summary.criticalIssues.length > 0) {
      console.log(`\n🚨 PROBLÈMES CRITIQUES (${summary.criticalIssues.length})`);
      summary.criticalIssues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });
    }

    // Avertissements
    if (summary.warnings.length > 0) {
      console.log(`\n⚠️  AVERTISSEMENTS (${summary.warnings.length})`);
      summary.warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning}`);
      });
    }

    // Recommandations
    if (summary.recommendations.length > 0) {
      console.log(`\n💡 RECOMMANDATIONS (${summary.recommendations.length})`);
      summary.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    }

    // Conclusion
    console.log(`\n🎯 CONCLUSION`);
    this.generateConclusion(summary);

    console.log(`\n📅 Rapport généré le: ${new Date().toISOString()}`);
    console.log('===========================================');
  }

  static getPhaseName(phase) {
    const phaseNames = {
      crud: 'CRUD Operations',
      errorHandling: 'Error Handling',
      typeScript: 'TypeScript Validation',
      performance: 'Performance Tests',
      dataConsistency: 'Data Consistency'
    };
    return phaseNames[phase] || phase;
  }

  static generateConclusion(summary) {
    const qualityScore = summary.qualityMetrics.overallQualityScore;
    const criticalCount = summary.criticalIssues.length;
    const successRate = summary.overallSuccessRate;

    if (criticalCount > 0) {
      console.log('❌ L\'API présente des problèmes critiques qui doivent être résolus avant la mise en production.');
      console.log('   Une nouvelle validation complète est recommandée après correction.');
    } else if (qualityScore >= 95 && successRate >= 98) {
      console.log('✅ L\'API est de qualité EXCELLENTE et prête pour la mise en production.');
      console.log('   Toutes les opérations CRUD fonctionnent de manière fiable et performante.');
    } else if (qualityScore >= 90 && successRate >= 95) {
      console.log('✅ L\'API est de TRÈS BONNE qualité et peut être mise en production.');
      console.log('   Les problèmes mineurs identifiés peuvent être traités en post-déploiement.');
    } else if (qualityScore >= 85 && successRate >= 90) {
      console.log('⚠️  L\'API est de qualité ACCEPTABLE mais nécessite des améliorations.');
      console.log('   Il est recommandé de traiter les avertissements avant la mise en production.');
    } else {
      console.log('❌ L\'API nécessite des améliorations significatives avant la mise en production.');
      console.log('   Une phase de développement supplémentaire est recommandée.');
    }

    // Recommandations de suivi
    console.log('\n📋 SUIVI RECOMMANDÉ:');
    if (summary.phaseResults.performance?.successRate < 90) {
      console.log('• Effectuer des tests de charge supplémentaires');
    }
    if (summary.phaseResults.errorHandling?.successRate < 95) {
      console.log('• Renforcer les tests de sécurité');
    }
    if (summary.phaseResults.dataConsistency?.successRate < 98) {
      console.log('• Vérifier l\'intégrité des données en production');
    }
    console.log('• Mettre en place un monitoring continu des performances');
    console.log('• Planifier des tests de régression réguliers');
  }

  static async generateHtmlReport(testResults, outputPath = './test-report.html') {
    // Cette méthode pourrait générer un rapport HTML détaillé
    // Pour l'instant, on génère un résumé JSON
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: testResults.masterSummary,
      detailedResults: testResults,
      metadata: {
        version: '1.0.0',
        environment: 'test',
        api: 'rooms-crud'
      }
    };

    const fs = require('fs');
    const reportJson = JSON.stringify(reportData, null, 2);
    
    try {
      fs.writeFileSync(outputPath.replace('.html', '.json'), reportJson);
      console.log(`\n📄 Rapport détaillé sauvegardé: ${outputPath.replace('.html', '.json')}`);
    } catch (error) {
      console.log(`⚠️  Impossible de sauvegarder le rapport: ${error.message}`);
    }

    return reportData;
  }
}

// Lancement de la suite complète si exécuté directement
if (require.main === module) {
  MasterTestSuite.runAllTests()
    .then(async (results) => {
      // Sauvegarder le rapport
      await MasterTestSuite.generateHtmlReport(results);
      
      // Code de sortie basé sur les résultats
      const hasCritical = results.masterSummary.criticalIssues.length > 0;
      const lowSuccessRate = results.masterSummary.overallSuccessRate < 90;
      
      if (hasCritical || lowSuccessRate) {
        console.log('\n❌ VALIDATION ÉCHOUÉE - Code de sortie: 1');
        process.exit(1);
      } else {
        console.log('\n✅ VALIDATION RÉUSSIE - Code de sortie: 0');
        process.exit(0);
      }
    })
    .catch(error => {
      console.error('\n🚨 ERREUR FATALE DANS LA SUITE DE TESTS:', error);
      process.exit(1);
    });
}

module.exports = {
  MasterTestSuite
};