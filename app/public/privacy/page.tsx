"use client"

import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href="/public" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
          ← Retour à l'accueil
        </Link>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Politique de Confidentialité</h1>
        <p className="text-gray-600">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
      </div>

      <div className="prose prose-lg max-w-none space-y-6">
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
          <p className="text-gray-700 leading-relaxed">
            ComeBac League ("nous", "notre", "nos") s'engage à protéger votre vie privée. Cette politique de confidentialité explique comment nous collectons, utilisons et protégeons vos informations personnelles lorsque vous utilisez notre site web.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Informations que nous collectons</h2>
          <p className="text-gray-700 leading-relaxed mb-3">
            Nous collectons les informations suivantes :
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Informations d'identification (nom, email) lorsque vous créez un compte</li>
            <li>Informations de profil (équipe, position, numéro de maillot)</li>
            <li>Données de navigation et d'utilisation du site</li>
            <li>Cookies et technologies similaires</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Utilisation des informations</h2>
          <p className="text-gray-700 leading-relaxed mb-3">
            Nous utilisons vos informations pour :
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Fournir et améliorer nos services</li>
            <li>Gérer votre compte et votre profil</li>
            <li>Vous envoyer des notifications importantes</li>
            <li>Analyser l'utilisation du site pour améliorer l'expérience utilisateur</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Publicités</h2>
          <p className="text-gray-700 leading-relaxed">
            Notre site utilise Google AdSense pour afficher des publicités. Google utilise des cookies pour personnaliser les annonces en fonction de vos visites sur notre site et d'autres sites web. Vous pouvez désactiver la personnalisation des annonces dans les paramètres de votre compte Google.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Partage des informations</h2>
          <p className="text-gray-700 leading-relaxed">
            Nous ne vendons pas vos informations personnelles. Nous pouvons partager vos informations uniquement dans les cas suivants :
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mt-3">
            <li>Avec votre consentement explicite</li>
            <li>Pour se conformer à la loi ou répondre à une demande légale</li>
            <li>Avec des prestataires de services de confiance qui nous aident à exploiter notre site</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Sécurité</h2>
          <p className="text-gray-700 leading-relaxed">
            Nous mettons en œuvre des mesures de sécurité appropriées pour protéger vos informations personnelles contre tout accès non autorisé, altération, divulgation ou destruction.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Vos droits</h2>
          <p className="text-gray-700 leading-relaxed mb-3">
            Vous avez le droit de :
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Accéder à vos informations personnelles</li>
            <li>Corriger vos informations personnelles</li>
            <li>Demander la suppression de vos informations personnelles</li>
            <li>Vous opposer au traitement de vos informations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Cookies</h2>
          <p className="text-gray-700 leading-relaxed">
            Notre site utilise des cookies pour améliorer votre expérience. Vous pouvez configurer votre navigateur pour refuser les cookies, mais cela peut affecter certaines fonctionnalités du site.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Modifications</h2>
          <p className="text-gray-700 leading-relaxed">
            Nous pouvons modifier cette politique de confidentialité de temps à autre. Nous vous informerons de tout changement en publiant la nouvelle politique sur cette page.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Contact</h2>
          <p className="text-gray-700 leading-relaxed">
            Pour toute question concernant cette politique de confidentialité, veuillez nous contacter à : <a href="mailto:contact@comebac.com" className="text-blue-600 hover:underline">contact@comebac.com</a>
          </p>
        </section>
      </div>
    </div>
  )
}

