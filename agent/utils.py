import os
import yaml


def load_prompt(filename):
    """Load a prompt from a YAML file."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    prompt_path = os.path.join(script_dir, "prompts", filename)

    try:
        with open(prompt_path, "r") as file:
            prompt_data = yaml.safe_load(file)
            assert isinstance(prompt_data, dict), (
                "The result of loading the YAML file must be a dictionary."
            )
            instructions = prompt_data.get("instructions", None)
            if instructions is None:
                raise ValueError("The 'instructions' key must be set in the YAML file.")
            return
    except (FileNotFoundError, yaml.YAMLError) as e:
        print(f"Error loading prompt file {filename}: {e}")
        return ""
