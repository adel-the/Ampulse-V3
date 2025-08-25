import React from 'react';

export const TypographyDemo = () => {
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-12">
      {/* Section Hero */}
      <section className="text-center space-y-4">
        <h1 className="text-hero font-display font-bold text-balance bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          SoliReserve Enhanced
        </h1>
        <p className="text-subtitle font-medium text-muted-foreground max-w-2xl mx-auto">
          Application moderne de gestion hôtelière avec une typographie optimisée pour une expérience utilisateur exceptionnelle
        </p>
      </section>

      {/* Section Titres */}
      <section className="space-y-6">
        <h2 className="text-display font-display font-semibold text-balance">
          Hiérarchie Typographique
        </h2>
        
        <div className="space-y-4">
          <div>
            <h1 className="text-4xl font-display font-bold mb-2">Titre H1 - Display Large</h1>
            <p className="text-caption">Font: Poppins, Weight: 700, Size: 2.25rem</p>
          </div>
          
          <div>
            <h2 className="text-3xl font-display font-semibold mb-2">Titre H2 - Display Medium</h2>
            <p className="text-caption">Font: Poppins, Weight: 600, Size: 1.875rem</p>
          </div>
          
          <div>
            <h3 className="text-2xl font-display font-semibold mb-2">Titre H3 - Headline</h3>
            <p className="text-caption">Font: Poppins, Weight: 600, Size: 1.5rem</p>
          </div>
          
          <div>
            <h4 className="text-xl font-display font-medium mb-2">Titre H4 - Subtitle</h4>
            <p className="text-caption">Font: Poppins, Weight: 500, Size: 1.25rem</p>
          </div>
          
          <div>
            <h5 className="text-lg font-display font-medium mb-2">Titre H5 - Body Large</h5>
            <p className="text-caption">Font: Poppins, Weight: 500, Size: 1.125rem</p>
          </div>
          
          <div>
            <h6 className="text-base font-display font-medium mb-2">Titre H6 - Body</h6>
            <p className="text-caption">Font: Poppins, Weight: 500, Size: 1rem</p>
          </div>
        </div>
      </section>

      {/* Section Texte */}
      <section className="space-y-6">
        <h2 className="text-display font-display font-semibold text-balance">
          Styles de Texte
        </h2>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <h3 className="text-headline font-display font-semibold mb-3">Texte Principal</h3>
              <p className="text-body">
                Ceci est un exemple de texte principal utilisant la police Inter avec une hauteur de ligne optimisée pour une lecture confortable. 
                La typographie moderne améliore considérablement l'expérience utilisateur.
              </p>
            </div>
            
            <div>
              <h3 className="text-headline font-display font-semibold mb-3">Texte Caption</h3>
              <p className="text-caption">
                Texte de légende plus petit pour les informations secondaires et les métadonnées.
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-headline font-display font-semibold mb-3">Poids de Police</h3>
              <div className="space-y-2">
                <p className="font-light">Light (300) - Texte très fin</p>
                <p className="font-normal">Normal (400) - Texte standard</p>
                <p className="font-medium">Medium (500) - Texte semi-gras</p>
                <p className="font-semibold">Semibold (600) - Texte demi-gras</p>
                <p className="font-bold">Bold (700) - Texte gras</p>
              </div>
            </div>
            
            <div>
              <h3 className="text-headline font-display font-semibold mb-3">Espacement des Lettres</h3>
              <div className="space-y-2">
                <p className="tracking-tighter">Tighter - Espacement très serré</p>
                <p className="tracking-tight">Tight - Espacement serré</p>
                <p className="tracking-normal">Normal - Espacement standard</p>
                <p className="tracking-wide">Wide - Espacement large</p>
                <p className="tracking-wider">Wider - Espacement très large</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Code */}
      <section className="space-y-6">
        <h2 className="text-display font-display font-semibold text-balance">
          Code et Données
        </h2>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-headline font-display font-semibold mb-3">Code Inline</h3>
            <p className="text-body">
              Utilisez <code className="font-mono">const variable = "valeur"</code> pour le code inline avec la police Roboto Mono.
            </p>
          </div>
          
          <div>
            <h3 className="text-headline font-display font-semibold mb-3">Bloc de Code</h3>
            <pre className="font-mono text-sm p-4 bg-muted rounded-lg overflow-x-auto">
{`function calculateTotal(items) {
  return items.reduce((sum, item) => {
    return sum + item.price;
  }, 0);
}`}
            </pre>
          </div>
        </div>
      </section>

      {/* Section Responsive */}
      <section className="space-y-6">
        <h2 className="text-display font-display font-semibold text-balance">
          Typographie Responsive
        </h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-hero font-display font-bold text-balance">
              Titre Hero Responsive
            </h3>
            <p className="text-caption">Taille: clamp(2.5rem, 5vw, 4rem) - S'adapte à la largeur d'écran</p>
          </div>
          
          <div>
            <h3 className="text-display font-display font-semibold text-balance">
              Titre Display Responsive
            </h3>
            <p className="text-caption">Taille: clamp(2rem, 4vw, 3rem) - Optimisé pour tous les écrans</p>
          </div>
          
          <div>
            <h3 className="text-headline font-display font-semibold text-balance">
              Titre Headline Responsive
            </h3>
            <p className="text-caption">Taille: clamp(1.5rem, 3vw, 2rem) - Parfait pour les sections</p>
          </div>
        </div>
      </section>

      {/* Section Accessibilité */}
      <section className="space-y-6">
        <h2 className="text-display font-display font-semibold text-balance">
          Accessibilité et Lisibilité
        </h2>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="text-headline font-display font-semibold">Contraste Optimisé</h3>
            <p className="text-body">
              Tous les textes respectent les standards WCAG pour un contraste optimal et une accessibilité maximale.
            </p>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-headline font-display font-semibold">Focus Visible</h3>
            <p className="text-body">
              Les éléments interactifs ont un focus visible pour la navigation au clavier.
            </p>
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
              Bouton avec Focus
            </button>
          </div>
        </div>
      </section>

      {/* Section Performance */}
      <section className="space-y-6">
        <h2 className="text-display font-display font-semibold text-balance">
          Performance et Optimisation
        </h2>
        
        <div className="grid gap-6 md:grid-cols-3">
          <div className="text-center p-6 bg-muted rounded-lg">
            <h3 className="text-headline font-display font-semibold mb-2">Font Display Swap</h3>
            <p className="text-caption">
              Les polices utilisent display: swap pour éviter le CLS (Cumulative Layout Shift)
            </p>
          </div>
          
          <div className="text-center p-6 bg-muted rounded-lg">
            <h3 className="text-headline font-display font-semibold mb-2">Preload Optimisé</h3>
            <p className="text-caption">
              Les polices critiques sont préchargées pour un rendu plus rapide
            </p>
          </div>
          
          <div className="text-center p-6 bg-muted rounded-lg">
            <h3 className="text-headline font-display font-semibold mb-2">Antialiasing</h3>
            <p className="text-caption">
              Rendu optimisé avec antialiasing pour une meilleure lisibilité
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
