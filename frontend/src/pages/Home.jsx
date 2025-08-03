import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Brain, ChefHat, Users } from 'lucide-react';

const Home = () => {
  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Suggestions',
      description: 'Get personalized recipe recommendations based on your current mood using Google Gemini AI.'
    },
    {
      icon: ChefHat,
      title: 'Curated Recipes',
      description: 'Access thousands of recipes from trusted sources, tailored to match your emotional state.'
    },
    {
      icon: Heart,
      title: 'Mood Tracking',
      description: 'Track your mood patterns and discover which foods help you feel your best.'
    },
    {
      icon: Users,
      title: 'Personal History',
      description: 'Keep track of your favorite mood-recipe combinations and build your personal cookbook.'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="text-center py-20">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          Cook Based on Your
          <span className="text-primary-500"> Mood</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Discover the perfect recipe for how you're feeling right now. 
          Let AI help you find comfort, energy, or celebration through food.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/signup"
            className="btn-primary text-lg px-8 py-3"
          >
            Get Started Free
          </Link>
          <Link
            to="/login"
            className="btn-secondary text-lg px-8 py-3"
          >
            Already have an account?
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            How MoodMenu Works
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our AI-powered platform understands your emotions and suggests recipes 
            that match your mood perfectly.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center p-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <feature.icon className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Demo Section */}
      <div className="py-20 bg-gradient-to-br from-primary-50 to-pink-50 rounded-3xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Experience the Magic
          </h2>
          <p className="text-lg text-gray-600">
            See how MoodMenu transforms your emotions into delicious meals
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-2xl">😔</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Feeling Down?</h3>
            <p className="text-gray-600">Get comfort food suggestions like mac and cheese or chocolate chip cookies</p>
          </div>

          <div className="text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-2xl">🎉</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Celebrating?</h3>
            <p className="text-gray-600">Discover festive recipes and special occasion dishes to mark the moment</p>
          </div>

          <div className="text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-2xl">💪</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Need Energy?</h3>
            <p className="text-gray-600">Find energizing meals with fresh ingredients and bold flavors</p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
          Ready to Start Cooking with Your Mood?
        </h2>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          Join thousands of users who have discovered the perfect recipe for every feeling.
        </p>
        <Link
          to="/signup"
          className="btn-primary text-lg px-8 py-3"
        >
          Start Your Culinary Journey
        </Link>
      </div>
    </div>
  );
};

export default Home;